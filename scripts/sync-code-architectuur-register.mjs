// REQ-AH-12: keep docs/code-architectuur-register.json's line counts derived, never
// hand-maintained. Runs as a pre-commit hook. It only refreshes the `lines` field of
// files already in the register — it does not decide positions or ceilings, and it
// never blocks a commit.
//
// With --check (mechanism 2, run in CI) it only verifies: it writes nothing, stages nothing,
// and exits 1 when any line count has drifted from the file on disk.
//
// The counting and the refresh are exported for scripts/sync-code-architectuur-register.test.mjs;
// main() only runs when the file is run directly.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const REGISTER_PATH = "docs/code-architectuur-register.json";

// The number of lines in a text: a final newline ends the last line, it does not start another.
export function countTextLines(content) {
  if (content === "") {
    return 0;
  }
  return content.split("\n").length - (content.endsWith("\n") ? 1 : 0);
}

function countLines(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    return null;
  }
  return countTextLines(readFileSync(absolutePath, "utf8"));
}

// The register with the `lines` of every entry set to what `measure` returns for its path, plus a
// line per entry that drifted. `measure` returns null for a file that no longer exists: that entry
// is left untouched, listed under `missing`, and is no drift. Pure: the register passed in is not
// changed, so whether anything gets written is up to the caller.
export function refreshLineCounts(register, measure) {
  const drifted = [];
  const missing = [];
  const files = register.files.map((file) => {
    const measured = measure(file.path);
    if (measured === null) {
      missing.push(file.path);
      return file;
    }
    if (file.lines === measured) {
      return file;
    }
    drifted.push(`${file.path}: register says ${file.lines}, file has ${measured}`);
    return { ...file, lines: measured };
  });
  return { register: { ...register, files }, drifted, missing };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const register = JSON.parse(readFileSync(join(ROOT, REGISTER_PATH), "utf8"));
  const refreshed = refreshLineCounts(register, countLines);
  for (const path of refreshed.missing) {
    console.warn(`sync-code-architectuur-register: ${path} no longer exists, leaving its entry untouched`);
  }

  if (checkOnly) {
    if (refreshed.drifted.length > 0) {
      console.error(`sync-code-architectuur-register: ${REGISTER_PATH} has drifted:`);
      for (const line of refreshed.drifted) {
        console.error(`  ${line}`);
      }
      console.error("Run: node scripts/sync-code-architectuur-register.mjs, then commit the register.");
      process.exit(1);
    }
    console.log(`sync-code-architectuur-register: ${REGISTER_PATH} is up to date`);
    process.exit(0);
  }

  // Only a changed count writes and stages: a register that already matches is left alone, so the
  // commit does not pick up edits to it that were never staged.
  if (refreshed.drifted.length === 0) {
    return;
  }
  writeFileSync(join(ROOT, REGISTER_PATH), `${JSON.stringify(refreshed.register, null, 2)}\n`);
  execFileSync("git", ["add", REGISTER_PATH], { cwd: ROOT });
  console.log(`sync-code-architectuur-register: refreshed line counts in ${REGISTER_PATH}`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
