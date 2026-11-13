// Drift signal for leading documents (REQ-GG-05): which documents describe code that has
// changed since the document was last reconciled against it.
//
//   npm run docs:drift
//
// A leading document is either a document under docs/ that names the code it describes in its
// front matter:
//
//   werkgebied:
//     - src/lib
//     - .env.example
//
// or a CLAUDE.md under src/, whose werkgebied is its own folder. Those carry no front matter:
// they are loaded into Claude's context verbatim.
//
// The baseline is the last closed reconciliation: the DFT register entry with `status: resolved`
// that lists the document under `documenten`, and the commit it names in `getoetst-tegen`, the
// commit the code was compared against. When several do, the newest commit wins, not the highest
// id: an ancestor of another one is older whatever its date, and the order of the register never
// decides. A commit that is not in the history of HEAD does not count. A path under `documenten`
// is the path of a document this script tracks, exactly as it lists it (forward slashes, from the
// root, same case). Nothing is normalised and anything else is a problem, so the register stays
// canonical and Windows and Linux agree; a leading document without a werkgebied, which this
// script does not track, cannot be booked there. A document no resolved DFT names was never
// reconciled and is measured from the commit that added it. Touching the document resets nothing,
// not even a commit that changes document and code together: that commit could hide earlier
// commits that nobody checked.
//
// The drift is every commit that touched the werkgebied after the baseline. Leading documents are
// never drift of themselves or of each other: the path of every leading document is left out of
// every werkgebied, so a commit that changes only src/lib/CLAUDE.md is no drift of the balance.
//
// This is a signal, not a verdict: "behind" means the code changed, not that the document is
// wrong. A reconciliation (a DFT) finds out which.
// Exit code 1 only for a problem: a werkgebied path that does not exist, or a DFT register entry
// whose documenten is not a block list of documents this script tracks, whose getoetst-tegen is
// not a commit hash or not one git can resolve, or that is resolved and lists documenten without
// getoetst-tegen or names a getoetst-tegen that is not in the history of HEAD.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { RECORD_TYPES } from "./records.mjs";

const DFT_REGISTER = RECORD_TYPES.find((type) => type.prefix === "DFT").register;

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function listFiles(root, dir, fileMatches) {
  const found = [];
  for (const entry of readdirSync(join(root, dir))) {
    const path = `${dir}/${entry}`;
    if (statSync(join(root, path)).isDirectory()) {
      found.push(...listFiles(root, path, fileMatches));
    } else if (fileMatches(entry)) {
      found.push(path);
    }
  }
  return found;
}

// The paths under `werkgebied:` in the front matter, or null when the document has none.
export function parseWerkgebied(text) {
  const frontMatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontMatter) {
    return null;
  }
  const field = frontMatter[1].match(/^werkgebied:[ \t]*\r?\n((?:[ \t]+- .*(?:\r?\n|$))+)/m);
  if (!field) {
    return null;
  }
  return field[1]
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s+- /, "").trim())
    .filter(Boolean);
}

// A YAML scalar without its quotes; an unquoted one also loses a trailing comment, which may be
// all there is (`documenten:  # the documents it checked`). A quoted one ends at its first closing
// quote; escapes are not read, as the values are paths, hashes, statuses and dates.
function unquote(value) {
  const quoted = value.match(/^(["'])(.*?)\1/);
  if (quoted) {
    return quoted[2];
  }
  return value.replace(/(^|\s+)#.*$/, "").trim();
}

// The DFT register entries with the fields the drift signal and the age check read. `documenten`
// and `getoetst-tegen` are optional. records.mjs reads only id and bestand and three scripts depend
// on it, so this reads the rest itself; like there, a line-by-line read is enough, as there is no
// YAML dependency in this repo. Only a block list is read under `documenten`; whatever is written
// on the `documenten:` line itself, such as a flow list, is kept in `documentenInline` so that it
// can be reported.
export function parseDftRegister(text) {
  const entries = [];
  let documentenListIsOpen = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(#.*)?$/.test(line)) {
      continue;
    }
    const idMatch = line.match(/^\s*- id:\s*["']?([A-Z]{3}-\d{3})["']?/);
    if (idMatch) {
      entries.push({
        id: idMatch[1],
        status: null,
        datum: null,
        documenten: [],
        documentenInline: null,
        getoetstTegen: null,
      });
      documentenListIsOpen = false;
      continue;
    }
    const entry = entries.at(-1);
    if (!entry) {
      continue;
    }
    const item = line.match(/^\s*-\s+(.*)$/);
    if (documentenListIsOpen && item) {
      entry.documenten.push(unquote(item[1]));
      continue;
    }
    documentenListIsOpen = false;
    const field = line.match(/^\s+([\w-]+):\s*(.*)$/);
    if (!field) {
      continue;
    }
    const [, key, value] = field;
    if (key === "status") {
      entry.status = unquote(value);
    } else if (key === "datum") {
      entry.datum = unquote(value) || null;
    } else if (key === "getoetst-tegen") {
      entry.getoetstTegen = unquote(value) || null;
    } else if (key === "documenten") {
      const inline = unquote(value);
      documentenListIsOpen = inline === "";
      if (inline !== "") {
        entry.documentenInline = inline;
      }
    }
  }
  return entries;
}

// The entries of the DFT register, or none when there is no register.
export function readDftRegister(root) {
  const registerPath = join(root, DFT_REGISTER);
  if (!existsSync(registerPath)) {
    return [];
  }
  return parseDftRegister(readFileSync(registerPath, "utf8"));
}

const DFT_MAX_OPEN_DAYS = 14;
const UNFINISHED_STATUSES = new Set(["open", "in_progress"]);
const DAY_MS = 24 * 60 * 60 * 1000;

// A DFT that stays open is a follow-up that can be forgotten (incident pattern
// promised-follow-up-dropped): DFT-003 stayed in_progress after its closing condition was met and
// nothing said so. One open or in progress for more than DFT_MAX_OPEN_DAYS days, counted from its
// datum, is a warning. Pure: `today` is a YYYY-MM-DD date passed in, so the check needs no clock.
// A DFT without a usable datum is skipped.
export function findStaleDfts(entries, today) {
  const warnings = [];
  for (const entry of entries) {
    if (!UNFINISHED_STATUSES.has(entry.status)) {
      continue;
    }
    // Date.parse rolls a date that does not exist over (2026-02-31 is 3 March), so only a datum
    // that comes back unchanged as YYYY-MM-DD counts.
    const opened = Date.parse(entry.datum ?? "");
    if (Number.isNaN(opened) || new Date(opened).toISOString().slice(0, 10) !== entry.datum) {
      continue;
    }
    // Both dates parse as UTC midnight, so the difference is a whole number of days.
    const days = Math.round((Date.parse(today) - opened) / DAY_MS);
    if (days > DFT_MAX_OPEN_DAYS) {
      warnings.push(
        `dft: ${entry.id} is still ${entry.status} ${days} days after it was opened (${entry.datum}); ` +
          "this warns until it is resolved. If it has to stay open, say why in the record.",
      );
    }
  }
  return warnings;
}

// The commit a revision names, or null when git cannot resolve it to one.
function commitInfo(root, revision) {
  try {
    const output = git(root, [
      "log",
      "-1",
      "--format=%H%x09%h%x09%ad%x09%ct",
      "--date=short",
      `${revision}^{commit}`,
      "--",
    ]).trim();
    if (!output) {
      return null;
    }
    const [full, hash, date, timestamp] = output.split("\t");
    return { full, hash, date, timestamp: Number(timestamp) };
  } catch {
    return null;
  }
}

// The commit that added the document at its current path. No --follow, as decided: a document
// that was moved is measured from the move.
function addedCommit(root, path) {
  try {
    const [first] = git(root, ["log", "--reverse", "--format=%H", "--", `:(literal)${path}`]).split("\n");
    if (!first) {
      return null;
    }
    return commitInfo(root, first);
  } catch {
    return null;
  }
}

function isAncestor(root, ancestor, descendant) {
  try {
    git(root, ["merge-base", "--is-ancestor", ancestor, descendant]);
    return true;
  } catch {
    return false;
  }
}

function isNewer(candidate, best) {
  if (candidate.timestamp !== best.timestamp) {
    return candidate.timestamp > best.timestamp;
  }
  if (candidate.full !== best.full) {
    return candidate.full > best.full;
  }
  return candidate.dft > best.dft;
}

// The newest of the reconciliations of one document. A commit that is an ancestor of another one
// is older whatever its date, so it drops out first: merge-base --independent keeps the commits no
// other one reaches. Of those the later committer date wins, then the larger full hash, so the
// order of the register never decides; several DFTs on one commit give the highest id.
function newest(root, reconciliations) {
  const commits = [...new Set(reconciliations.map((reconciliation) => reconciliation.full))];
  const tips = new Set(
    commits.length > 1 ? git(root, ["merge-base", "--independent", ...commits]).split("\n").filter(Boolean) : commits,
  );
  return reconciliations
    .filter((reconciliation) => tips.has(reconciliation.full))
    .reduce((best, candidate) => (isNewer(candidate, best) ? candidate : best));
}

// Per document path, the newest commit a resolved DFT reconciled it against, and the problems
// in the register. `leadingPaths` holds the paths of the documents docs:drift tracks.
function readReconciliations(root, leadingPaths) {
  const reconciliations = new Map();
  const problems = [];
  for (const entry of readDftRegister(root)) {
    const where = `${entry.id} in ${DFT_REGISTER}`;
    if (entry.documentenInline !== null) {
      problems.push(`drift: ${where} lists documenten inline (${entry.documentenInline}); use a block list`);
    }
    const documenten = entry.documenten.filter((path) => {
      if (leadingPaths.has(path)) {
        return true;
      }
      problems.push(
        `drift: ${where} names ${path} under documenten, which docs:drift does not track ` +
          "(write the path exactly as docs:drift lists it; a document without a werkgebied cannot be booked here)",
      );
      return false;
    });
    if (entry.getoetstTegen === null) {
      // An open or in-progress DFT has not been checked against a commit yet; a resolved one has.
      if (entry.status === "resolved" && entry.documenten.length > 0) {
        problems.push(`drift: ${where} is resolved and lists documenten but has no getoetst-tegen`);
      }
      continue;
    }
    // A getoetst-tegen is a short or long commit hash. Checking the form before git sees it keeps
    // out a ref such as `main`, which git resolves but which moves, and a value that starts with a
    // dash, which git would read as an option.
    if (!/^[0-9a-f]{4,40}$/i.test(entry.getoetstTegen)) {
      problems.push(`drift: ${where} has getoetst-tegen ${entry.getoetstTegen}, which is not a commit hash`);
      continue;
    }
    const commit = commitInfo(root, entry.getoetstTegen);
    if (!commit) {
      problems.push(`drift: ${where} has getoetst-tegen ${entry.getoetstTegen}, which git cannot resolve to a commit`);
      continue;
    }
    if (entry.status !== "resolved") {
      continue;
    }
    // For a commit HEAD does not have, X..HEAD holds only what HEAD added since the two lines
    // forked, so the document could read as up to date against code HEAD never had.
    if (!isAncestor(root, commit.full, "HEAD")) {
      problems.push(
        `drift: ${where} has getoetst-tegen ${entry.getoetstTegen}, which is not in the history of HEAD; ` +
          "point it at the commit that holds the reconciled code",
      );
      continue;
    }
    for (const path of documenten) {
      reconciliations.set(path, [...(reconciliations.get(path) ?? []), { ...commit, dft: entry.id }]);
    }
  }
  const baselines = new Map(
    [...reconciliations].map(([path, candidates]) => [path, newest(root, candidates)]),
  );
  return { baselines, problems };
}

// Every leading document with its werkgebied: the documents under docs/ that declare one in their
// front matter, and every CLAUDE.md under src/, whose werkgebied is its own folder.
export function listLeadingDocuments(root) {
  const leading = [];
  if (existsSync(join(root, "docs"))) {
    for (const path of listFiles(root, "docs", (entry) => entry.endsWith(".md"))) {
      const scope = parseWerkgebied(readFileSync(join(root, path), "utf8"));
      if (scope) {
        leading.push({ path, scope });
      }
    }
  }
  if (existsSync(join(root, "src"))) {
    for (const path of listFiles(root, "src", (entry) => entry === "CLAUDE.md")) {
      leading.push({ path, scope: [posix.dirname(path)] });
    }
  }
  return leading;
}

export function findDrift(root) {
  const documents = [];
  const skipped = [];
  const leading = listLeadingDocuments(root);
  const leadingPaths = leading.map((document) => document.path);
  const { baselines, problems } = readReconciliations(root, new Set(leadingPaths));
  // literal: without it git also reads a path as a glob, so a document named `[ab].md` would
  // leave out a.md too.
  const excludes = leadingPaths.map((path) => `:(exclude,literal)${path}`);
  for (const { path, scope } of leading) {
    for (const entry of scope) {
      if (!existsSync(join(root, entry))) {
        problems.push(`drift: ${path} names ${entry} in werkgebied, which does not exist`);
      }
    }
    const reconciled = baselines.get(path);
    const commit = reconciled ?? addedCommit(root, path);
    if (!commit) {
      skipped.push(path);
      continue;
    }
    const baseline = { hash: commit.hash, date: commit.date, dft: reconciled?.dft ?? null };
    const existing = scope.filter((entry) => existsSync(join(root, entry)));
    let commits = [];
    let files = [];
    if (existing.length > 0) {
      const pathspec = [...existing, ...excludes];
      commits = git(root, [
        "log",
        `${commit.full}..HEAD`,
        "--format=%h%x09%ad%x09%s",
        "--date=short",
        "--",
        ...pathspec,
      ])
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [hash, date, ...subject] = line.split("\t");
          return { hash, date, subject: subject.join("\t") };
        });
      if (commits.length > 0) {
        files = git(root, ["diff", "--name-only", commit.full, "HEAD", "--", ...pathspec])
          .split("\n")
          .filter(Boolean);
      }
    }
    documents.push({ path, baseline, scope, commits, files });
  }
  return { documents, problems, skipped };
}

function describeBaseline(baseline) {
  if (baseline.dft) {
    return `last reconciled in ${baseline.dft} at ${baseline.hash} (${baseline.date})`;
  }
  return `never reconciled; measured since it was added in ${baseline.hash} (${baseline.date})`;
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const { documents, problems, skipped } = findDrift(root);
  if (documents.length === 0 && skipped.length === 0) {
    console.log("drift: no leading document with a werkgebied found.");
  }
  for (const document of documents) {
    console.log(`${document.path}\n  ${describeBaseline(document.baseline)}`);
    if (document.commits.length === 0) {
      console.log("  up to date: nothing changed in its werkgebied since.");
      continue;
    }
    console.log(
      `  behind: ${document.commits.length} commit(s) touched its werkgebied, ` +
        `${document.files.length} file(s) changed.`,
    );
    for (const commit of document.commits) {
      console.log(`    ${commit.hash} ${commit.date} ${commit.subject}`);
    }
    console.log(`  files: ${document.files.join(", ")}`);
    console.log(
      "  next: reconcile the document against these files and book the result as a DFT that " +
        "lists it under documenten, with getoetst-tegen set to the commit you checked against.",
    );
  }
  for (const path of skipped) {
    console.log(`${path}: not committed yet, no baseline; skipped.`);
  }
  for (const problem of problems) {
    console.error(`ERROR    ${problem}`);
  }
  process.exit(problems.length > 0 ? 1 : 0);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
