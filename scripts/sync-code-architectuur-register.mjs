// REQ-AH-12: keep docs/code-architectuur-register.json's line counts derived, never
// hand-maintained. Runs as a pre-commit hook. It only refreshes the `lines` field of
// files already in the register — it does not decide positions or ceilings, and it
// never blocks a commit.
//
// With --check (mechanism 2, run in CI) it only verifies: it writes nothing, stages nothing,
// and exits 1 when any line count has drifted from the file on disk.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const REGISTER_PATH = "docs/code-architectuur-register.json";
const CHECK_ONLY = process.argv.includes("--check");

function countLines(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    return null;
  }
  const content = readFileSync(absolutePath, "utf8");
  if (content === "") {
    return 0;
  }
  return content.split("\n").length - (content.endsWith("\n") ? 1 : 0);
}

const register = JSON.parse(readFileSync(join(ROOT, REGISTER_PATH), "utf8"));

let changed = false;
const drifted = [];
for (const file of register.files) {
  const measured = countLines(file.path);
  if (measured === null) {
    console.warn(`sync-code-architectuur-register: ${file.path} no longer exists, leaving its entry untouched`);
    continue;
  }
  if (file.lines !== measured) {
    drifted.push(`${file.path}: register says ${file.lines}, file has ${measured}`);
    file.lines = measured;
    changed = true;
  }
}

if (CHECK_ONLY) {
  if (drifted.length > 0) {
    console.error(`sync-code-architectuur-register: ${REGISTER_PATH} has drifted:`);
    for (const line of drifted) {
      console.error(`  ${line}`);
    }
    console.error("Run: node scripts/sync-code-architectuur-register.mjs, then commit the register.");
    process.exit(1);
  }
  console.log(`sync-code-architectuur-register: ${REGISTER_PATH} is up to date`);
  process.exit(0);
}

if (changed) {
  writeFileSync(join(ROOT, REGISTER_PATH), `${JSON.stringify(register, null, 2)}\n`);
  execFileSync("git", ["add", REGISTER_PATH], { cwd: ROOT });
  console.log(`sync-code-architectuur-register: refreshed line counts in ${REGISTER_PATH}`);
}
