// Tests for isRunDirectly, the guard that lets a script run main() only when it is run, not when
// it is imported. Run with `npm run test:scripts`. Started through a junction or from a folder
// with a space, the scripts are covered by sync-code-architectuur-register.test.mjs; this covers
// an import whose argv[1] is not the script, or not a file at all.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { isRunDirectly } from "./run-directly.mjs";

const roots = [];

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop(), { recursive: true, force: true });
  }
});

describe("isRunDirectly", () => {
  it("is false for a module that is imported, not run", () => {
    // argv[1] is this test file, an existing file that is not the helper.
    assert.equal(isRunDirectly(new URL("./run-directly.mjs", import.meta.url).href), false);
  });

  // Behind `node -e`, the first extra argument is argv[1]. A guard that resolved it without a catch
  // threw ENOENT while the script was being imported.
  it("lets a script be imported when argv[1] is not a file", () => {
    // An empty folder as the working directory, so the argument cannot name a file by chance.
    const cwd = mkdtempSync(join(tmpdir(), "run-directly-test-"));
    roots.push(cwd);
    const script = new URL("./incidents.mjs", import.meta.url).href;
    const { status, stdout, stderr } = spawnSync(
      process.execPath,
      ["-e", `import(${JSON.stringify(script)})`, "not-a-file"],
      { cwd, encoding: "utf8" },
    );
    // Empty stdout: the import did not mistake itself for a run, so main() stayed out.
    assert.deepEqual({ status, stdout, stderr }, { status: 0, stdout: "", stderr: "" });
  });
});
