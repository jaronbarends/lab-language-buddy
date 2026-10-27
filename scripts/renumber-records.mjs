// Renumbers the grootboek records a branch added when their ids collide with records already
// in a base ref (HDR-005: the branch that merges second renumbers its own records).
// Run it BEFORE merging the base ref into the branch; the guard-merge-renumber hook asks for it.
//
//   npm run docs:renumber                      renumber against origin/arc/arc-main
//   npm run docs:renumber -- --base main       against another ref
//   npm run docs:renumber -- --check           only report collisions (exit 0, JSON on stdout)
//   --no-fetch                                 do not run `git fetch origin` first
//
// Why a plain find-and-replace is safe: before the merge, every mention of a colliding id in
// the lines this branch added means the branch's own record. Only those lines are touched, in
// documents, registers and source comments (see REWRITABLE).
// Exit codes: 0 done or nothing to do, 2 refused (see the message), 3 base ref not found.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { RECORD_TYPES, checkRecords, formatId, idNumber, parseRegister } from "./records.mjs";

const DEFAULT_BASE = "origin/arc/arc-main";

// The text files whose added lines may mention a record id: documents and registers, and the
// source files that cite a record in a comment (DFT-003). Other files are left alone.
const REWRITABLE = /\.(md|ya?ml|json|css|[cm]?[jt]sx?)$/;

export class Refusal extends Error {
  constructor(message, kind = "refused") {
    super(message);
    this.kind = kind;
  }
}

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitOrNull(root, args) {
  try {
    return git(root, args);
  } catch {
    return null;
  }
}

function assertCanRun(root, baseRef) {
  const mergeHeadPath = git(root, ["rev-parse", "--git-path", "MERGE_HEAD"]).trim();
  if (existsSync(isAbsolute(mergeHeadPath) ? mergeHeadPath : join(root, mergeHeadPath))) {
    throw new Refusal(
      "A merge is in progress. Run `git merge --abort`, then this script, then merge again: " +
        "after a merge the references to a colliding id are ambiguous.",
    );
  }
  if (gitOrNull(root, ["rev-parse", "--verify", "--quiet", `${baseRef}^{commit}`]) === null) {
    throw new Refusal(`Base ref ${baseRef} not found.`, "no-base");
  }
}

// The renumbering plan: one entry per record this branch added whose id the base already holds
// for a different record. Same id and same file means the record has already landed: it stays.
export function findCollisions(root, baseRef) {
  assertCanRun(root, baseRef);
  const collisions = [];
  for (const type of RECORD_TYPES) {
    const registerPath = join(root, type.register);
    if (!existsSync(registerPath)) {
      continue;
    }
    const own = parseRegister(readFileSync(registerPath, "utf8"));
    const ownIds = new Set();
    for (const entry of own) {
      if (ownIds.has(entry.id)) {
        throw new Refusal(
          `${entry.id} appears twice in ${type.register}. Abort any merge in progress, ` +
            "restore the register from before it, and run this script first.",
        );
      }
      ownIds.add(entry.id);
    }
    const base = parseRegister(gitOrNull(root, ["show", `${baseRef}:${type.register}`]) ?? "");
    const baseFileById = new Map(base.map((entry) => [entry.id, entry.bestand]));
    let highest = Math.max(0, ...own.map((entry) => idNumber(entry.id)), ...base.map((entry) => idNumber(entry.id)));
    for (const entry of own) {
      if (!baseFileById.has(entry.id) || baseFileById.get(entry.id) === entry.bestand) {
        continue;
      }
      highest += 1;
      const newId = formatId(type.prefix, highest);
      collisions.push({
        oldId: entry.id,
        newId,
        folder: type.folder,
        bestand: entry.bestand,
        newBestand: entry.bestand.replace(`${entry.id.toLowerCase()}-`, `${newId.toLowerCase()}-`),
      });
    }
  }
  return collisions;
}

// path -> Set of 1-based line numbers this branch added or changed since the merge-base,
// read from the working tree so uncommitted edits count too.
function addedLinesSince(root, mergeBase) {
  const addedByFile = new Map();
  const diff = git(root, ["diff", "-U0", "--no-color", "--no-renames", mergeBase]);
  let currentFile = null;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ /dev/null")) {
      currentFile = null;
      continue;
    }
    const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      addedByFile.set(currentFile, new Set());
      continue;
    }
    const hunkMatch = line.match(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/);
    if (hunkMatch && currentFile) {
      const start = Number(hunkMatch[1]);
      const count = hunkMatch[2] === undefined ? 1 : Number(hunkMatch[2]);
      for (let number = start; number < start + count; number += 1) {
        addedByFile.get(currentFile).add(number);
      }
    }
  }
  for (const path of git(root, ["ls-files", "--others", "--exclude-standard"]).split("\n")) {
    if (path) {
      addedByFile.set(path, "all");
    }
  }
  return addedByFile;
}

function replaceIds(line, newIdByOldId) {
  const upper = line.replace(/\b[A-Z]{3}-\d{3}\b/g, (id) => newIdByOldId.get(id) ?? id);
  return upper.replace(/\b([a-z]{3})-(\d{3})-/g, (match, prefix, number) => {
    const newId = newIdByOldId.get(`${prefix.toUpperCase()}-${number}`);
    return newId ? `${newId.toLowerCase()}-` : match;
  });
}

export function renumber(root, baseRef) {
  const collisions = findCollisions(root, baseRef);
  if (collisions.length === 0) {
    return { collisions, editedFiles: [] };
  }
  const newIdByOldId = new Map(collisions.map((collision) => [collision.oldId, collision.newId]));
  const mergeBase = git(root, ["merge-base", "HEAD", baseRef]).trim();
  const editedFiles = [];
  for (const [path, added] of addedLinesSince(root, mergeBase)) {
    const fullPath = join(root, path);
    if (!existsSync(fullPath) || !REWRITABLE.test(path)) {
      continue;
    }
    const lines = readFileSync(fullPath, "utf8").split("\n");
    let changed = false;
    const rewritten = lines.map((line, index) => {
      if (added !== "all" && !added.has(index + 1)) {
        return line;
      }
      const replaced = replaceIds(line, newIdByOldId);
      changed = changed || replaced !== line;
      return replaced;
    });
    if (changed) {
      writeFileSync(fullPath, rewritten.join("\n"));
      editedFiles.push(path);
    }
  }
  for (const collision of collisions) {
    const from = `${collision.folder}/${collision.bestand}`;
    const to = `${collision.folder}/${collision.newBestand}`;
    const isTracked = gitOrNull(root, ["ls-files", "--error-unmatch", from]) !== null;
    if (isTracked) {
      git(root, ["mv", from, to]);
    } else {
      renameSync(join(root, from), join(root, to));
    }
  }
  const problems = checkRecords(root);
  if (problems.length > 0) {
    throw new Refusal(`Renumbered, but the registers are not consistent:\n${problems.join("\n")}`);
  }
  return { collisions, editedFiles };
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const baseIndex = args.indexOf("--base");
  const baseRef = baseIndex >= 0 ? args[baseIndex + 1] : DEFAULT_BASE;
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  try {
    if (!args.includes("--no-fetch") && baseRef.startsWith("origin/")) {
      gitOrNull(root, ["fetch", "--quiet", "origin"]);
    }
    if (checkOnly) {
      console.log(JSON.stringify({ collisions: findCollisions(root, baseRef) }));
      return;
    }
    const { collisions, editedFiles } = renumber(root, baseRef);
    if (collisions.length === 0) {
      console.log(`renumber: no colliding record ids against ${baseRef}; nothing to do.`);
      return;
    }
    for (const collision of collisions) {
      console.log(`renumber: ${collision.oldId} -> ${collision.newId} (${collision.newBestand})`);
    }
    console.log(`renumber: edited ${editedFiles.length} file(s). Review \`git status\`, then commit.`);
  } catch (error) {
    if (!(error instanceof Refusal)) {
      throw error;
    }
    if (checkOnly) {
      console.log(JSON.stringify({ refusal: error.message, kind: error.kind }));
    } else {
      console.error(`renumber: ${error.message}`);
    }
    process.exit(error.kind === "no-base" ? 3 : 2);
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
