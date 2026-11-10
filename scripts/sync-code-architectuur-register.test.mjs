// Tests for the line-count sync of the code-architecture register (REQ-AH-12). Run with
// `npm run test:scripts`. The pure tests hand the refresh a measure function. The command tests
// copy the script into a throwaway git repo and run it there, as the pre-commit hook and
// register:check run it: the script finds the register through its own location, so the real
// register and the real git index stay out of reach.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { countTextLines, refreshLineCounts } from "./sync-code-architectuur-register.mjs";

const SCRIPT = "scripts/sync-code-architectuur-register.mjs";
const REGISTER = "docs/code-architectuur-register.json";
const PREFIX = "sync-code-architectuur-register:";
const roots = [];

// A register in the shape of docs/code-architectuur-register.json, one entry per path with its
// line count.
function makeRegister(lineCounts) {
  return {
    thresholds: { warnAtLines: 300, hardLimitAtLines: 400 },
    files: Object.entries(lineCounts).map(([path, lines]) => ({
      path,
      position: "ceiling",
      ceiling: 600,
      lines,
      reason: "A reason.",
    })),
  };
}

// The register as the script writes it.
function format(register) {
  return `${JSON.stringify(register, null, 2)}\n`;
}

function git(root, ...args) {
  return execFileSync(
    "git",
    ["-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
}

function write(root, path, text) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

function read(root, path) {
  return readFileSync(join(root, path), "utf8");
}

// A throwaway git repo with a copy of the script, the files (path to text) and a register with
// the line counts given, all committed. The repo gets its real path: the script runs main() only
// when it was started with its own path, and a temp folder can sit behind a symlink (/var on
// macOS). autocrlf is off so that git add prints no line-ending warning, whatever the global
// config says.
function makeRepo(files, lineCounts) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "sync-register-test-")));
  roots.push(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "core.autocrlf", "false");
  mkdirSync(join(root, "scripts"));
  copyFileSync(fileURLToPath(new URL("./sync-code-architectuur-register.mjs", import.meta.url)), join(root, SCRIPT));
  for (const [path, text] of Object.entries(files)) {
    write(root, path, text);
  }
  write(root, REGISTER, format(makeRegister(lineCounts)));
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "register and code");
  return root;
}

// The paths in the index that differ from the last commit.
function staged(root) {
  return git(root, "diff", "--cached", "--name-only").split("\n").filter(Boolean);
}

function run(root, ...args) {
  const { status, stdout, stderr } = spawnSync(process.execPath, [join(root, SCRIPT), ...args], {
    cwd: root,
    encoding: "utf8",
  });
  return { status, stdout, stderr };
}

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop(), { recursive: true, force: true });
  }
});

describe("counting lines", () => {
  it("counts a final newline as the end of the last line, not as a new one", () => {
    assert.equal(countTextLines(""), 0);
    assert.equal(countTextLines("one"), 1);
    assert.equal(countTextLines("one\n"), 1);
    assert.equal(countTextLines("one\ntwo"), 2);
    assert.equal(countTextLines("one\ntwo\n"), 2);
    assert.equal(countTextLines("one\r\ntwo\r\n"), 2);
  });
});

describe("refreshing the line counts", () => {
  it("sets a changed count and reports it, without changing the register passed in", () => {
    const register = makeRegister({ "src/a.ts": 2, "src/b.ts": 5 });
    const before = structuredClone(register);
    const measured = { "src/a.ts": 3, "src/b.ts": 5 };
    const refreshed = refreshLineCounts(register, (path) => measured[path]);
    // Compared as text: the order of the keys is what the script writes.
    assert.equal(format(refreshed.register), format(makeRegister(measured)));
    assert.deepEqual(refreshed.drifted, ["src/a.ts: register says 2, file has 3"]);
    assert.deepEqual(refreshed.missing, []);
    assert.deepEqual(register, before);
  });

  it("reports nothing for a register that already matches", () => {
    const register = makeRegister({ "src/a.ts": 2, "src/b.ts": 5 });
    const refreshed = refreshLineCounts(register, (path) => register.files.find((file) => file.path === path).lines);
    assert.deepEqual(refreshed.register, register);
    assert.deepEqual(refreshed.drifted, []);
    assert.deepEqual(refreshed.missing, []);
  });

  it("leaves the entry of a file that no longer exists untouched, and does not count it as drift", () => {
    const register = makeRegister({ "src/a.ts": 2, "src/gone.ts": 7 });
    const refreshed = refreshLineCounts(register, (path) => (path === "src/gone.ts" ? null : 2));
    assert.deepEqual(refreshed.register, register);
    assert.deepEqual(refreshed.drifted, []);
    assert.deepEqual(refreshed.missing, ["src/gone.ts"]);
  });
});

describe("the command, as the pre-commit hook runs it", () => {
  it("writes a changed count and stages the register, and nothing else", () => {
    const root = makeRepo({ "src/a.ts": "one\ntwo\n" }, { "src/a.ts": 2 });
    write(root, "src/a.ts", "one\ntwo\nthree\n");
    assert.deepEqual(run(root), {
      status: 0,
      stdout: `${PREFIX} refreshed line counts in ${REGISTER}\n`,
      stderr: "",
    });
    assert.equal(read(root, REGISTER), format(makeRegister({ "src/a.ts": 3 })));
    assert.deepEqual(staged(root), [REGISTER]);
  });

  it("leaves a register that already matches alone: no write and no git add", () => {
    const root = makeRepo({ "src/a.ts": "one\ntwo\n" }, { "src/a.ts": 2 });
    // An unstaged edit to the register, in a layout the script does not write: a write would undo
    // the layout, and a git add would stage the edit.
    const edited = JSON.stringify(makeRegister({ "src/a.ts": 2 }));
    write(root, REGISTER, edited);
    assert.deepEqual(run(root), { status: 0, stdout: "", stderr: "" });
    assert.equal(read(root, REGISTER), edited);
    assert.deepEqual(staged(root), []);
  });

  it("warns about a file that no longer exists and keeps its entry, while it refreshes the others", () => {
    const root = makeRepo({ "src/a.ts": "one\n", "src/gone.ts": "one\ntwo\n" }, { "src/a.ts": 1, "src/gone.ts": 2 });
    rmSync(join(root, "src/gone.ts"));
    write(root, "src/a.ts", "one\ntwo\n");
    assert.deepEqual(run(root), {
      status: 0,
      stdout: `${PREFIX} refreshed line counts in ${REGISTER}\n`,
      stderr: `${PREFIX} src/gone.ts no longer exists, leaving its entry untouched\n`,
    });
    assert.equal(read(root, REGISTER), format(makeRegister({ "src/a.ts": 2, "src/gone.ts": 2 })));
    assert.deepEqual(staged(root), [REGISTER]);
  });
});

describe("the command with --check, as register:check runs it", () => {
  it("exits 1 and lists the drift, without writing or staging anything", () => {
    const root = makeRepo({ "src/a.ts": "one\ntwo\n", "src/b.ts": "one\n" }, { "src/a.ts": 2, "src/b.ts": 1 });
    write(root, "src/a.ts", "one\ntwo\nthree\n");
    write(root, "src/b.ts", "one\ntwo\n");
    const before = read(root, REGISTER);
    assert.deepEqual(run(root, "--check"), {
      status: 1,
      stdout: "",
      stderr: [
        `${PREFIX} ${REGISTER} has drifted:`,
        "  src/a.ts: register says 2, file has 3",
        "  src/b.ts: register says 1, file has 2",
        "Run: node scripts/sync-code-architectuur-register.mjs, then commit the register.",
        "",
      ].join("\n"),
    });
    assert.equal(read(root, REGISTER), before);
    assert.deepEqual(staged(root), []);
  });

  it("exits 0 when the register is up to date, with a warning for a file that no longer exists", () => {
    const root = makeRepo({ "src/a.ts": "one\n", "src/gone.ts": "one\n" }, { "src/a.ts": 1, "src/gone.ts": 1 });
    rmSync(join(root, "src/gone.ts"));
    assert.deepEqual(run(root, "--check"), {
      status: 0,
      stdout: `${PREFIX} ${REGISTER} is up to date\n`,
      stderr: `${PREFIX} src/gone.ts no longer exists, leaving its entry untouched\n`,
    });
    assert.deepEqual(staged(root), []);
  });
});
