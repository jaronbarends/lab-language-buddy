// REQ-AH-12: keep docs/code-architectuur-register.json's line counts derived, never
// hand-maintained. Runs as a pre-commit hook. It only refreshes the `lines` field of
// files already in the register — it does not decide positions or ceilings, and it
// never blocks a commit. The CI-gate that blocks on drift is a separate piece of work.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const REGISTER_PATH = "docs/code-architectuur-register.json";

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
for (const file of register.files) {
  const measured = countLines(file.path);
  if (measured === null) {
    console.warn(`sync-code-architectuur-register: ${file.path} no longer exists, leaving its entry untouched`);
    continue;
  }
  if (file.lines !== measured) {
    file.lines = measured;
    changed = true;
  }
}

if (changed) {
  writeFileSync(join(ROOT, REGISTER_PATH), `${JSON.stringify(register, null, 2)}\n`);
  execFileSync("git", ["add", REGISTER_PATH], { cwd: ROOT });
  console.log(`sync-code-architectuur-register: refreshed line counts in ${REGISTER_PATH}`);
}
