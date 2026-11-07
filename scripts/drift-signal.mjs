// Drift signal for leading documents (REQ-GG-05): which documents describe code that has
// changed since the document was last touched.
//
//   npm run docs:drift
//
// A leading document names the code it describes in its front matter:
//
//   werkgebied:
//     - src/lib
//     - .env.example
//
// The baseline is the last commit that touched the document; the drift is every commit that
// touched its werkgebied after that. This is a signal, not a verdict: "behind" means the code
// changed, not that the document is wrong. A reconciliation (a DFT) finds out which.
// Exit code 1 only for a problem: a werkgebied path that does not exist.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function listMarkdown(root, dir) {
  const found = [];
  for (const entry of readdirSync(join(root, dir))) {
    const path = `${dir}/${entry}`;
    if (statSync(join(root, path)).isDirectory()) {
      found.push(...listMarkdown(root, path));
    } else if (entry.endsWith(".md")) {
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

function lastCommitOf(root, path) {
  try {
    const output = git(root, ["log", "-1", "--format=%h%x09%ad", "--date=short", "--", path]).trim();
    if (!output) {
      return null;
    }
    const [hash, date] = output.split("\t");
    return { hash, date };
  } catch {
    return null;
  }
}

export function findDrift(root) {
  const documents = [];
  const problems = [];
  const skipped = [];
  if (!existsSync(join(root, "docs"))) {
    return { documents, problems, skipped };
  }
  for (const path of listMarkdown(root, "docs")) {
    const scope = parseWerkgebied(readFileSync(join(root, path), "utf8"));
    if (!scope) {
      continue;
    }
    for (const entry of scope) {
      if (!existsSync(join(root, entry))) {
        problems.push(`drift: ${path} names ${entry} in werkgebied, which does not exist`);
      }
    }
    const baseline = lastCommitOf(root, path);
    if (!baseline) {
      skipped.push(path);
      continue;
    }
    const existing = scope.filter((entry) => existsSync(join(root, entry)));
    let commits = [];
    let files = [];
    if (existing.length > 0) {
      commits = git(root, [
        "log",
        `${baseline.hash}..HEAD`,
        "--format=%h%x09%ad%x09%s",
        "--date=short",
        "--",
        ...existing,
      ])
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [hash, date, ...subject] = line.split("\t");
          return { hash, date, subject: subject.join("\t") };
        });
      if (commits.length > 0) {
        files = git(root, ["diff", "--name-only", baseline.hash, "HEAD", "--", ...existing])
          .split("\n")
          .filter(Boolean);
      }
    }
    documents.push({ path, baseline, scope, commits, files });
  }
  return { documents, problems, skipped };
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const { documents, problems, skipped } = findDrift(root);
  if (documents.length === 0 && skipped.length === 0) {
    console.log("drift: no document declares a werkgebied.");
  }
  for (const document of documents) {
    const heading = `${document.path} (last touched ${document.baseline.hash}, ${document.baseline.date})`;
    if (document.commits.length === 0) {
      console.log(`${heading}\n  up to date: nothing changed in its werkgebied since.`);
      continue;
    }
    console.log(
      `${heading}\n  behind: ${document.commits.length} commit(s) touched its werkgebied, ` +
        `${document.files.length} file(s) changed.`,
    );
    for (const commit of document.commits) {
      console.log(`    ${commit.hash} ${commit.date} ${commit.subject}`);
    }
    console.log(`  files: ${document.files.join(", ")}`);
    console.log("  next: reconcile the document against these files and book the result as a DFT.");
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
