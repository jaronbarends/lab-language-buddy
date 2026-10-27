// Tests for the drift signal. Run with `npm run test:scripts`. Each test builds its own
// throwaway git repo: a leading document with a werkgebied, committed together with the code
// it describes.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { findDrift, parseWerkgebied } from "./drift-signal.mjs";

const DOC = "docs/grootboek/balance.md";
const roots = [];

function makeRepo() {
  const root = mkdtempSync(join(tmpdir(), "drift-test-"));
  roots.push(root);
  git(root, "init", "-q", "-b", "main");
  write(root, DOC, "---\ntitel: Balance\nwerkgebied:\n  - src/lib\n  - .env.example\n---\n\n# Balance\n");
  write(root, "src/lib/a.ts", "export const a = 1;\n");
  write(root, "src/other/z.ts", "export const z = 1;\n");
  write(root, ".env.example", "A=1\n");
  commit(root, "balance and code");
  return root;
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

function commit(root, message) {
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", message);
}

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop(), { recursive: true, force: true });
  }
});

describe("reading the werkgebied field", () => {
  it("returns the listed paths", () => {
    assert.deepEqual(parseWerkgebied("---\nwerkgebied:\n  - src/lib\n  - next.config.ts\nbron: x\n---\n"), [
      "src/lib",
      "next.config.ts",
    ]);
  });

  it("returns null when there is no field or no front matter", () => {
    assert.equal(parseWerkgebied("---\ntitel: x\n---\n"), null);
    assert.equal(parseWerkgebied("# just a document\n"), null);
  });
});

describe("finding drift", () => {
  it("reports nothing when the werkgebied has not changed since the document", () => {
    const root = makeRepo();
    const { documents, problems } = findDrift(root);
    assert.equal(documents.length, 1);
    assert.equal(documents[0].commits.length, 0);
    assert.deepEqual(problems, []);
  });

  it("reports a change inside the werkgebied, with the file", () => {
    const root = makeRepo();
    write(root, "src/lib/a.ts", "export const a = 2;\n");
    commit(root, "change a");
    const [document] = findDrift(root).documents;
    assert.equal(document.commits.length, 1);
    assert.equal(document.commits[0].subject, "change a");
    assert.deepEqual(document.files, ["src/lib/a.ts"]);
  });

  it("matches files below a folder and a single listed file", () => {
    const root = makeRepo();
    write(root, "src/lib/deep/b.ts", "export const b = 1;\n");
    write(root, ".env.example", "A=1\nB=2\n");
    commit(root, "deeper file and env");
    const [document] = findDrift(root).documents;
    assert.deepEqual(document.files.sort(), [".env.example", "src/lib/deep/b.ts"]);
  });

  it("ignores a change outside the werkgebied", () => {
    const root = makeRepo();
    write(root, "src/other/z.ts", "export const z = 2;\n");
    write(root, "docs/plan.md", "# plan\n");
    commit(root, "outside the scope");
    assert.equal(findDrift(root).documents[0].commits.length, 0);
  });

  it("resets when the document is touched afterwards", () => {
    const root = makeRepo();
    write(root, "src/lib/a.ts", "export const a = 2;\n");
    commit(root, "change a");
    write(root, DOC, "---\ntitel: Balance\nwerkgebied:\n  - src/lib\n  - .env.example\n---\n\n# Balance, updated\n");
    commit(root, "update the balance");
    assert.equal(findDrift(root).documents[0].commits.length, 0);
  });

  it("ignores a document without a werkgebied", () => {
    const root = makeRepo();
    write(root, "docs/grootboek/other.md", "---\ntitel: Other\n---\n");
    commit(root, "a document without a scope");
    assert.equal(findDrift(root).documents.length, 1);
  });

  it("skips a document that is not committed yet", () => {
    const root = makeRepo();
    write(root, "docs/grootboek/new.md", "---\nwerkgebied:\n  - src/lib\n---\n");
    const result = findDrift(root);
    assert.deepEqual(result.skipped, ["docs/grootboek/new.md"]);
    assert.equal(result.documents.length, 1);
  });

  it("reports a werkgebied path that does not exist as a problem", () => {
    const root = makeRepo();
    write(root, DOC, "---\nwerkgebied:\n  - src/lib\n  - src/renamed\n---\n");
    commit(root, "name a folder that is not there");
    const { problems } = findDrift(root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /names src\/renamed in werkgebied, which does not exist/);
  });
});
