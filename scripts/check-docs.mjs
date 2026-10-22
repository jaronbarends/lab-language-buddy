// Drift check: does the documentation still describe what is in the repo?
// Run with `npm run docs:check`. Errors exit 1; warnings only print.
//
// What it checks, and why each is mechanical rather than a judgement call:
//   1. every process.env.X read in src/ is in .env.example      (error)
//   2. every variable in .env.example appears in README.md       (error)
//   3. every repo path in backticks in the context docs exists   (error)
//   4. docs/index.yml lists existing paths, and every .md under
//      docs/ is listed                                           (error)
//   5. plan.md is not more than 30 days older than the newest
//      commit that touched src/                                  (warning)
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const MAX_PLAN_LAG_DAYS = 30;

const errors = [];
const warnings = [];

function read(path) {
  return readFileSync(join(ROOT, path), "utf8");
}

function listFiles(dir, extensions) {
  const found = [];
  for (const entry of readdirSync(join(ROOT, dir))) {
    const path = `${dir}/${entry}`;
    if (statSync(join(ROOT, path)).isDirectory()) {
      found.push(...listFiles(path, extensions));
    } else if (extensions.some((extension) => entry.endsWith(extension))) {
      found.push(path);
    }
  }
  return found;
}

const envExample = read(".env.example");
const documentedEnvNames = new Set(
  [...envExample.matchAll(/^#?\s*([A-Z][A-Z0-9_]+)=/gm)].map((match) => match[1]),
);

// 1. env variables read in code are documented
const sourceFiles = listFiles("src", [".ts", ".tsx"]);
const usedEnvNames = new Set();
for (const file of sourceFiles) {
  for (const match of read(file).matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) {
    usedEnvNames.add(match[1]);
  }
}
// Set by Next or the platform, not by us.
const PLATFORM_ENV_NAMES = new Set(["NODE_ENV"]);
for (const name of usedEnvNames) {
  if (!documentedEnvNames.has(name) && !PLATFORM_ENV_NAMES.has(name)) {
    errors.push(`env: ${name} is read in src/ but missing from .env.example`);
  }
}

// 2. env variables in .env.example are mentioned in the README
const readme = read("README.md");
for (const name of documentedEnvNames) {
  if (!readme.includes(name)) {
    errors.push(`env: ${name} is in .env.example but not in README.md`);
  }
}

// 3. repo paths in backticks exist
const contextDocs = [
  "README.md",
  "CLAUDE.md",
  "docs/index.yml",
  ...listFiles(".claude/rules", [".md"]),
  ...listFiles("src", ["CLAUDE.md"]),
];
const PATH_PATTERN = /^[\w.@-]+(\/[\w.@-]+)+\/?$/;
const REPO_ROOTS = ["src", "docs", ".claude", "spikes", "scripts", "public"];
// Gitignored runtime artifacts that CLAUDE.md documents by path but that only exist while
// active (e.g. a time-boxed hook override) — absent is their normal, expected state.
const EPHEMERAL_PATHS = new Set([
  ".claude/.hoofdthread-override.json",
  "docs/.refactor-pending.json",
]);
for (const doc of contextDocs) {
  for (const match of read(doc).matchAll(/`([^`\s]+)`/g)) {
    const token = match[1];
    if (!PATH_PATTERN.test(token) || !REPO_ROOTS.includes(token.split("/")[0])) {
      continue;
    }
    if (EPHEMERAL_PATHS.has(token)) {
      continue;
    }
    if (!existsSync(join(ROOT, token))) {
      errors.push(`path: ${doc} mentions \`${token}\`, which does not exist`);
    }
  }
}

// 4. the register and docs/ agree
const index = read("docs/index.yml");
const registeredPaths = [...index.matchAll(/^\s+- path: (\S+)/gm)].map((m) => m[1]);
for (const path of registeredPaths) {
  if (!existsSync(join(ROOT, path))) {
    errors.push(`index: docs/index.yml lists ${path}, which does not exist`);
  }
}
for (const file of listFiles("docs", [".md"])) {
  if (!registeredPaths.includes(file)) {
    errors.push(`index: ${file} is not listed in docs/index.yml`);
  }
}

// 5. the plan keeps up with the code
function lastCommitTime(path) {
  const output = execFileSync("git", ["log", "-1", "--format=%ct", "--", path], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  return output ? Number(output) : null;
}
const planTime = lastCommitTime("docs/plan.md");
const sourceTime = lastCommitTime("src");
if (planTime && sourceTime) {
  const lagDays = Math.floor((sourceTime - planTime) / 86400);
  if (lagDays > MAX_PLAN_LAG_DAYS) {
    warnings.push(`plan: docs/plan.md is ${lagDays} days older than the newest change in src/`);
  }
}

for (const warning of warnings) {
  console.warn(`warning  ${warning}`);
}
for (const error of errors) {
  console.error(`ERROR    ${error}`);
}
console.log(
  `docs:check: ${errors.length} error(s), ${warnings.length} warning(s), ` +
    `${sourceFiles.length} source files, ${registeredPaths.length} registered documents ` +
    `(${relative(process.cwd(), ROOT) || "."})`,
);
process.exit(errors.length > 0 ? 1 : 0);
