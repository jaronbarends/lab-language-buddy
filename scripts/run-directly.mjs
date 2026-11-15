// Whether the module at `importMetaUrl` is the script node was started with, so a script runs
// main() only when it is run, not when a test or another script imports it.
//
// Both sides go through realpath: process.argv[1] keeps the path the script was started with,
// symlink or junction included, while import.meta.url of the main module is the resolved path.
// Compared as written, a script started through a symlinked temp folder (/var on macOS) or a
// junction to the repo on Windows would not recognise itself and exit 0 without doing anything.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function isRunDirectly(importMetaUrl) {
  if (!process.argv[1]) {
    return false;
  }
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(importMetaUrl));
  } catch {
    // argv[1] is not a file (node -e with arguments, node - reading stdin): not run directly.
    return false;
  }
}
