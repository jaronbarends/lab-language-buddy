// REQ-AH-13: the full-disk sweep. Unlike sync-code-architectuur-register.mjs (which only
// refreshes files already in the register), this walks every file under src/ and classifies
// it against the register's decisions and global thresholds — so a brand-new file that grew
// past the doorbell without ever being registered is still caught.
//
// Output: a JSON array of { path, lines, status: "orange" | "red", reason } for files that
// need attention. Files that are green, or that have a registered "excluded"/"ceiling" within
// their limit, are left out entirely.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isRunDirectly } from "./run-directly.mjs";
import { countTextLines } from "./sync-code-architectuur-register.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTER_PATH = "docs/code-architectuur-register.json";
const SWEEP_ROOT = "src";
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(join(ROOT, dir))) {
    const path = `${dir}/${entry}`;
    if (statSync(join(ROOT, path)).isDirectory()) {
      found.push(...walk(path));
      continue;
    }
    found.push(path);
  }
  return found;
}

function loadRegister() {
  const path = join(ROOT, REGISTER_PATH);
  if (!existsSync(path)) {
    return { thresholds: { warnAtLines: 300, hardLimitAtLines: 400 }, files: [] };
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

export function sweep() {
  const register = loadRegister();
  const { warnAtLines, hardLimitAtLines } = register.thresholds;
  const decisions = new Map(register.files.map((file) => [file.path, file]));

  const flagged = [];
  for (const file of walk(SWEEP_ROOT)) {
    const ext = `.${file.split(".").pop()}`;
    if (!SOURCE_EXTENSIONS.has(ext)) {
      continue;
    }

    const lines = countTextLines(readFileSync(join(ROOT, file), "utf8"));
    const decision = decisions.get(file);

    if (decision?.position === "excluded") {
      continue;
    }

    const limit = decision?.position === "ceiling" ? decision.ceiling : hardLimitAtLines;
    if (lines > limit) {
      flagged.push({
        path: file,
        lines,
        status: "red",
        reason: decision
          ? `over its registered ceiling of ${decision.ceiling} lines`
          : `over the hard limit (${hardLimitAtLines}) with no register entry`,
      });
      continue;
    }

    if (!decision && lines > warnAtLines) {
      flagged.push({
        path: file,
        lines,
        status: "orange",
        reason: `over the doorbell (${warnAtLines}) with no register entry`,
      });
    }
  }

  return flagged;
}

if (isRunDirectly(import.meta.url)) {
  console.log(JSON.stringify(sweep(), null, 2));
}
