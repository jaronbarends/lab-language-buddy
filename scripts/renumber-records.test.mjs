// Tests for the record renumbering (HDR-005) and the register checks. Run with
// `npm run test:scripts`. Each test uses a throwaway git repo in a temp folder: a base branch
// that took HDR-002 for one record, and a feature branch that took HDR-002 for another.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { checkRecords } from "./records.mjs";
import { Refusal, findCollisions, renumber } from "./renumber-records.mjs";

let root;

function git(...args) {
  return execFileSync(
    "git",
    ["-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
}

function write(path, text) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function commit(message) {
  git("add", "-A");
  git("commit", "-q", "-m", message);
}

function hdrEntry(id, file) {
  return `  - id: "${id}"\n    titel: "x"\n    status: implemented\n    bestand: ${file}\n`;
}

function indexLine(file) {
  return `  - path: docs/grootboek/hdr/${file}\n    what: a record\n`;
}

const HDR_REGISTER = "docs/grootboek/registers/hdr-register.yml";
const JNL_REGISTER = "docs/grootboek/registers/jnl-register.yml";

before(() => {
  root = mkdtempSync(join(tmpdir(), "renumber-test-"));
  git("init", "-q", "-b", "main");

  write(HDR_REGISTER, `hdrs:\n${hdrEntry("HDR-001", "hdr-001-first.md")}`);
  write("docs/grootboek/hdr/hdr-001-first.md", "# HDR-001: first\n");
  write("docs/index.yml", `documents:\n${indexLine("hdr-001-first.md")}`);
  write("src/old.ts", "// mentions HDR-002 on a line the branch did not add\n");
  commit("main");

  // base: the branch that merged first, and took HDR-002 for the hook
  git("switch", "-q", "-c", "base");
  write(HDR_REGISTER, read(HDR_REGISTER) + hdrEntry("HDR-002", "hdr-002-hook.md"));
  write("docs/grootboek/hdr/hdr-002-hook.md", "# HDR-002: hook\n");
  write("docs/index.yml", read("docs/index.yml") + indexLine("hdr-002-hook.md"));
  commit("base takes HDR-002");

  // feature: forked from main, also took HDR-002, and refers to it from a journal
  git("switch", "-q", "main");
  git("switch", "-q", "-c", "feature");
  write(HDR_REGISTER, read(HDR_REGISTER) + hdrEntry("HDR-002", "hdr-002-trial.md"));
  write("docs/grootboek/hdr/hdr-002-trial.md", "# HDR-002: trial\n\nBuilds on HDR-001.\n");
  write("docs/index.yml", read("docs/index.yml") + indexLine("hdr-002-trial.md"));
  write(JNL_REGISTER, 'jnls:\n  - id: "JNL-001"\n    doel-records:\n      - "HDR-002"\n    bestand: jnl-001-notes.md\n');
  write("docs/grootboek/journaal/jnl-001-notes.md", "Decided in HDR-002 (see hdr-002-trial.md). HDR-001 stays.\n");
  write("src/components/x.tsx", "// Built on HDR-002 (see JNL-001); HDR-001 stays.\nexport const x = 1;\n");
  commit("feature takes HDR-002");
});

after(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("renumbering against a base that took the same id", () => {
  it("finds the collision and plans the next free number", () => {
    const collisions = findCollisions(root, "base");
    assert.equal(collisions.length, 1);
    assert.equal(collisions[0].oldId, "HDR-002");
    assert.equal(collisions[0].newId, "HDR-003");
    assert.equal(collisions[0].newBestand, "hdr-003-trial.md");
  });

  it("renames the record and rewrites the register, the index and the references", () => {
    renumber(root, "base");
    assert.ok(existsSync(join(root, "docs/grootboek/hdr/hdr-003-trial.md")));
    assert.ok(!existsSync(join(root, "docs/grootboek/hdr/hdr-002-trial.md")));
    assert.match(read(HDR_REGISTER), /id: "HDR-003"[\s\S]*bestand: hdr-003-trial\.md/);
    assert.match(read("docs/index.yml"), /hdr-003-trial\.md/);
    assert.match(read("docs/grootboek/hdr/hdr-003-trial.md"), /# HDR-003: trial/);
    assert.equal(
      read("docs/grootboek/journaal/jnl-001-notes.md"),
      "Decided in HDR-003 (see hdr-003-trial.md). HDR-001 stays.\n",
    );
    assert.match(read(JNL_REGISTER), /- "HDR-003"/);
    assert.deepEqual(checkRecords(root), []);
  });

  it("rewrites a reference in a source comment the branch added (DFT-003)", () => {
    assert.equal(
      read("src/components/x.tsx"),
      "// Built on HDR-003 (see JNL-001); HDR-001 stays.\nexport const x = 1;\n",
    );
  });

  it("leaves a line in a source file that the branch did not add alone", () => {
    assert.equal(read("src/old.ts"), "// mentions HDR-002 on a line the branch did not add\n");
  });

  it("leaves a record that already landed alone", () => {
    assert.match(read(HDR_REGISTER), /id: "HDR-001"[\s\S]*bestand: hdr-001-first\.md/);
    assert.ok(existsSync(join(root, "docs/grootboek/hdr/hdr-001-first.md")));
  });

  it("does nothing on a second run", () => {
    const before = read(HDR_REGISTER);
    const result = renumber(root, "base");
    assert.deepEqual(result.collisions, []);
    assert.equal(read(HDR_REGISTER), before);
  });
});

describe("refusals", () => {
  it("refuses while a merge is in progress", () => {
    writeFileSync(join(root, ".git", "MERGE_HEAD"), `${git("rev-parse", "HEAD").trim()}\n`);
    try {
      assert.throws(() => findCollisions(root, "base"), Refusal);
    } finally {
      rmSync(join(root, ".git", "MERGE_HEAD"));
    }
  });

  it("refuses when the branch already holds a duplicated id", () => {
    const original = read(HDR_REGISTER);
    write(HDR_REGISTER, original + hdrEntry("HDR-001", "hdr-001-first.md"));
    try {
      assert.throws(() => findCollisions(root, "base"), Refusal);
    } finally {
      write(HDR_REGISTER, original);
    }
  });

  it("reports a base ref that does not exist", () => {
    assert.throws(
      () => findCollisions(root, "no-such-ref"),
      (error) => error instanceof Refusal && error.kind === "no-base",
    );
  });
});

describe("the register checks used by docs:check", () => {
  it("flags a duplicated id, a missing file and a file name that does not start with its id", () => {
    const original = read(HDR_REGISTER);
    write(
      HDR_REGISTER,
      original + hdrEntry("HDR-001", "hdr-001-first.md") + hdrEntry("HDR-009", "HDR-009-wrong-case.md"),
    );
    try {
      const problems = checkRecords(root).join("\n");
      assert.match(problems, /HDR-001 appears more than once/);
      assert.match(problems, /HDR-009 names HDR-009-wrong-case\.md, which is not in/);
      assert.match(problems, /should start with hdr-009-/);
    } finally {
      write(HDR_REGISTER, original);
    }
  });
});
