// Tests for the full-disk sweep of src/ (REQ-AH-13). Run with `npm run test:scripts`. Each test
// copies the script and the modules it imports into a throwaway folder, whose name contains a
// space, and runs it there as a command: the script finds src/ and the register through its own
// location, so the real repo stays out of reach. There is no register in the folder, so the
// default thresholds apply (doorbell 300, hard limit 400).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = "scripts/sweep-code-architectuur.mjs";
const COPIED_SCRIPTS = ["sweep-code-architectuur.mjs", "run-directly.mjs", "sync-code-architectuur-register.mjs"];
const roots = [];

// `count` numbered lines, with or without a final newline.
function numberedLines(count, { finalNewline }) {
  const text = Array.from({ length: count }, (_, index) => `const line${index + 1} = ${index + 1};`).join("\n");
  return finalNewline ? `${text}\n` : text;
}

// A throwaway folder with a copy of the scripts and the files (path to text).
function makeRoot(files) {
  const root = mkdtempSync(join(tmpdir(), "sweep code-architectuur test-"));
  roots.push(root);
  mkdirSync(join(root, "scripts"));
  for (const script of COPIED_SCRIPTS) {
    copyFileSync(fileURLToPath(new URL(`./${script}`, import.meta.url)), join(root, "scripts", script));
  }
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

// The flagged files the script prints, after checking that it ran cleanly.
function sweep(root) {
  const { status, stdout, stderr } = spawnSync(process.execPath, [join(root, SCRIPT)], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(stderr, "");
  assert.equal(status, 0);
  return JSON.parse(stdout);
}

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop(), { recursive: true, force: true });
  }
});

describe("the sweep, run as a command", () => {
  it("flags a file over the hard limit as red and leaves a small file out", () => {
    const root = makeRoot({
      "src/big.ts": numberedLines(401, { finalNewline: false }),
      "src/small.ts": numberedLines(3, { finalNewline: true }),
    });
    assert.deepEqual(sweep(root), [
      {
        path: "src/big.ts",
        lines: 401,
        status: "red",
        reason: "over the hard limit (400) with no register entry",
      },
    ]);
  });

  it("counts a final newline as the end of the last line, not as a new one", () => {
    const root = makeRoot({ "src/medium.ts": numberedLines(301, { finalNewline: true }) });
    assert.deepEqual(sweep(root), [
      {
        path: "src/medium.ts",
        lines: 301,
        status: "orange",
        reason: "over the doorbell (300) with no register entry",
      },
    ]);
  });
});
