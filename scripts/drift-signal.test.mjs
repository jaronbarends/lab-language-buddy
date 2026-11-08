// Tests for the drift signal. Run with `npm run test:scripts`. Each test builds its own
// throwaway git repo: a leading document with a werkgebied, committed together with the code
// it describes.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { findDrift, findStaleDfts, parseDftRegister, parseWerkgebied } from "./drift-signal.mjs";

const DOC = "docs/grootboek/balance.md";
const NOTES = "src/lib/CLAUDE.md";
const REGISTER = "docs/grootboek/registers/dft-register.yml";
const EARLY = "2026-01-01 12:00:00 +0000";
const LATE = "2026-06-01 12:00:00 +0000";
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

// `env` sets extra environment variables for this one call, such as GIT_COMMITTER_DATE.
function gitWith(root, env, args) {
  return execFileSync(
    "git",
    ["-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env } },
  );
}

function git(root, ...args) {
  return gitWith(root, {}, args);
}

function write(root, path, text) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

// Without a committerDate the commit gets the current time, as usual.
function commit(root, message, committerDate) {
  git(root, "add", "-A");
  gitWith(root, committerDate ? { GIT_COMMITTER_DATE: committerDate } : {}, ["commit", "-q", "-m", message]);
}

// Each call writes a new version of a.ts, so every call is a commit in the balance's werkgebied.
let changeCount = 0;
function changeCode(root, message, committerDate) {
  changeCount += 1;
  write(root, "src/lib/a.ts", `export const a = ${changeCount + 1};\n`);
  commit(root, message, committerDate);
}

function head(root) {
  return git(root, "log", "-1", "--format=%h").trim();
}

// A DFT register in the shape of docs/grootboek/registers/dft-register.yml. An entry without
// getoetstTegen leaves the field out.
function writeRegister(root, entries) {
  const lines = ["dfts:"];
  for (const entry of entries) {
    lines.push(`  - id: "${entry.id}"`, `    titel: "Reconciliation ${entry.id}"`, `    status: ${entry.status}`);
    lines.push("    documenten:", ...entry.documenten.map((path) => `      - ${path}`));
    if (entry.getoetstTegen !== undefined) {
      lines.push(`    getoetst-tegen: ${entry.getoetstTegen}`);
    }
    lines.push(`    bestand: ${entry.id.toLowerCase()}-test.md`);
  }
  write(root, REGISTER, `${lines.join("\n")}\n`);
}

// Resolved DFTs for DOC, numbered in the order of the hashes given.
function writeResolved(root, hashes) {
  writeRegister(
    root,
    hashes.map((hash, index) => ({
      id: `DFT-00${index + 1}`,
      status: "resolved",
      documenten: [DOC],
      getoetstTegen: hash,
    })),
  );
}

function subjects(document) {
  return document.commits.map((entry) => entry.subject);
}

function documentAt(root, path) {
  return findDrift(root).documents.find((document) => document.path === path);
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

describe("reading the DFT register", () => {
  it("reads status, datum, documenten with and without quotes, and getoetst-tegen", () => {
    const text = [
      "# DFT Register",
      "dfts:",
      '  - id: "DFT-001"',
      '    titel: "First: a reconciliation"',
      "    status: resolved",
      "    datum: 2026-10-21",
      "    documenten:",
      "      - docs/a.md",
      '      - "src/lib/CLAUDE.md"',
      "      - 'docs/b.md'",
      '    getoetst-tegen: "ddab397"',
      "    bestand: dft-001-first.md",
      '  - id: "DFT-002"',
      "    status: open",
      "    bestand: dft-002-second.md",
    ].join("\r\n");
    assert.deepEqual(parseDftRegister(text), [
      {
        id: "DFT-001",
        status: "resolved",
        datum: "2026-10-21",
        documenten: ["docs/a.md", "src/lib/CLAUDE.md", "docs/b.md"],
        documentenInline: null,
        getoetstTegen: "ddab397",
      },
      { id: "DFT-002", status: "open", datum: null, documenten: [], documentenInline: null, getoetstTegen: null },
    ]);
  });

  it("keeps the documenten list open after a comment on its line", () => {
    const text = 'dfts:\n  - id: "DFT-001"\n    documenten:  # the documents it checked\n      - docs/a.md\n';
    const [entry] = parseDftRegister(text);
    assert.deepEqual(entry.documenten, ["docs/a.md"]);
    assert.equal(entry.documentenInline, null);
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

  it("does not reset when the document is touched afterwards", () => {
    const root = makeRepo();
    changeCode(root, "change a");
    write(root, DOC, "---\ntitel: Balance\nwerkgebied:\n  - src/lib\n  - .env.example\n---\n\n# Balance, updated\n");
    commit(root, "update the balance");
    assert.deepEqual(subjects(findDrift(root).documents[0]), ["change a"]);
  });

  it("does not reset on a commit that changes the document and the code together", () => {
    const root = makeRepo();
    changeCode(root, "change a");
    write(root, DOC, "---\ntitel: Balance\nwerkgebied:\n  - src/lib\n  - .env.example\n---\n\n# Balance, with b\n");
    write(root, "src/lib/b.ts", "export const b = 1;\n");
    commit(root, "add b and describe it");
    assert.deepEqual(subjects(findDrift(root).documents[0]), ["add b and describe it", "change a"]);
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

  it("leaves out only the leading documents, even when a path holds glob characters", () => {
    const root = makeRepo();
    const odd = "docs/notes/[ab].md";
    write(root, odd, "---\nwerkgebied:\n  - docs/notes\n---\n");
    write(root, "docs/notes/a.md", "# a\n");
    commit(root, "add a document whose name is a glob");
    write(root, "docs/notes/a.md", "# a, changed\n");
    commit(root, "change a note");
    write(root, odd, "---\nwerkgebied:\n  - docs/notes\n---\n\n# Edited\n");
    commit(root, "edit the document itself");
    assert.deepEqual(subjects(documentAt(root, odd)), ["change a note"]);
  });
});

describe("the baseline", () => {
  it("is the getoetst-tegen commit of a resolved DFT: only later commits count", () => {
    const root = makeRepo();
    changeCode(root, "before the reconciliation");
    const checked = head(root);
    writeRegister(root, [{ id: "DFT-001", status: "resolved", documenten: [DOC], getoetstTegen: checked }]);
    commit(root, "book DFT-001");
    changeCode(root, "after the reconciliation");
    const document = documentAt(root, DOC);
    assert.equal(document.baseline.dft, "DFT-001");
    assert.equal(document.baseline.hash, checked);
    assert.deepEqual(subjects(document), ["after the reconciliation"]);
  });

  it("ignores a DFT that is open or in progress", () => {
    const root = makeRepo();
    changeCode(root, "before the reconciliation");
    const checked = head(root);
    writeRegister(root, [
      { id: "DFT-001", status: "open", documenten: [DOC], getoetstTegen: checked },
      { id: "DFT-002", status: "in_progress", documenten: [DOC], getoetstTegen: checked },
    ]);
    commit(root, "book two unfinished DFTs");
    const document = documentAt(root, DOC);
    assert.equal(document.baseline.dft, null);
    assert.deepEqual(subjects(document), ["before the reconciliation"]);
  });

  it("takes the newest commit when two resolved DFTs name the document, not the highest id", () => {
    const root = makeRepo();
    changeCode(root, "first change");
    const older = head(root);
    changeCode(root, "second change");
    const newer = head(root);
    changeCode(root, "third change");
    writeResolved(root, [newer, older]);
    commit(root, "book both DFTs");
    const document = documentAt(root, DOC);
    assert.equal(document.baseline.dft, "DFT-001");
    assert.equal(document.baseline.hash, newer);
    assert.deepEqual(subjects(document), ["third change"]);
  });

  it("takes the newest of three, listed oldest, newest, middle", () => {
    const root = makeRepo();
    changeCode(root, "oldest change");
    const oldest = head(root);
    changeCode(root, "middle change");
    const middle = head(root);
    changeCode(root, "newest change");
    const newest = head(root);
    changeCode(root, "after all three");
    writeResolved(root, [oldest, newest, middle]);
    const document = documentAt(root, DOC);
    assert.equal(document.baseline.dft, "DFT-002");
    assert.equal(document.baseline.hash, newest);
    assert.deepEqual(subjects(document), ["after all three"]);
  });

  it("takes a descendant over its ancestor, even when the descendant has the older committer date", () => {
    const root = makeRepo();
    changeCode(root, "the ancestor", LATE);
    const ancestor = head(root);
    changeCode(root, "the descendant", EARLY);
    const descendant = head(root);
    changeCode(root, "after the descendant");
    // Both orders: the ancestor check runs in each direction.
    for (const order of [
      [ancestor, descendant],
      [descendant, ancestor],
    ]) {
      writeResolved(root, order);
      const document = documentAt(root, DOC);
      assert.equal(document.baseline.hash, descendant, `register order ${order.join(", ")}`);
      assert.deepEqual(subjects(document), ["after the descendant"]);
    }
  });

  it("takes the later committer date for two commits on separate lines of history", () => {
    const root = makeRepo();
    git(root, "checkout", "-q", "-b", "side");
    write(root, "src/lib/side.ts", "export const side = 1;\n");
    commit(root, "on the side line", EARLY);
    const earlier = head(root);
    git(root, "checkout", "-q", "main");
    write(root, "src/lib/main.ts", "export const main = 1;\n");
    commit(root, "on the main line", LATE);
    const later = head(root);
    git(root, "merge", "-q", "--no-edit", "side");
    // Both orders: neither commit is an ancestor of the other, so only the date decides.
    for (const order of [
      [earlier, later],
      [later, earlier],
    ]) {
      writeResolved(root, order);
      assert.equal(documentAt(root, DOC).baseline.hash, later, `register order ${order.join(", ")}`);
    }
  });

  it("is the commit that added the document when it was never reconciled", () => {
    const root = makeRepo();
    const second = "docs/grootboek/second.md";
    changeCode(root, "before the second document");
    write(root, second, "---\nwerkgebied:\n  - src/lib\n---\n\n# Second\n");
    commit(root, "add the second document");
    const added = head(root);
    changeCode(root, "after the second document");
    write(root, second, "---\nwerkgebied:\n  - src/lib\n---\n\n# Second, fixed a typo\n");
    commit(root, "fix a typo in the second document");
    const document = documentAt(root, second);
    assert.equal(document.baseline.dft, null);
    assert.equal(document.baseline.hash, added);
    assert.deepEqual(subjects(document), ["after the second document"]);
  });
});

describe("a CLAUDE.md under src/", () => {
  it("is a leading document for its own folder, without counting itself", () => {
    const root = makeRepo();
    write(root, NOTES, "# Notes for src/lib\n");
    commit(root, "add the lib notes");
    write(root, NOTES, "# Notes for src/lib, edited\n");
    commit(root, "edit the lib notes");
    write(root, "src/other/z.ts", "export const z = 2;\n");
    commit(root, "change another folder");
    changeCode(root, "change a");
    const document = documentAt(root, NOTES);
    assert.deepEqual(document.scope, ["src/lib"]);
    assert.deepEqual(subjects(document), ["change a"]);
    assert.deepEqual(document.files, ["src/lib/a.ts"]);
  });
});

describe("leading documents inside each other's werkgebied", () => {
  it("are no drift when only the other document changed", () => {
    const root = makeRepo();
    write(root, NOTES, "# Notes for src/lib\n");
    commit(root, "add the lib notes");
    write(root, NOTES, "# Notes for src/lib, edited\n");
    commit(root, "edit the lib notes");
    assert.deepEqual(subjects(documentAt(root, DOC)), []);
  });

  it("leave the other document out of the files when it changed together with code", () => {
    const root = makeRepo();
    write(root, NOTES, "# Notes for src/lib\n");
    write(root, "src/lib/a.ts", "export const a = 2;\n");
    commit(root, "change a and describe it in the notes");
    const document = documentAt(root, DOC);
    assert.deepEqual(subjects(document), ["change a and describe it in the notes"]);
    assert.deepEqual(document.files, ["src/lib/a.ts"]);
  });
});

describe("problems in the DFT register", () => {
  it("reports a path under documenten that is not exactly the path of a document docs:drift tracks", () => {
    const root = makeRepo();
    write(root, "docs/plain.md", "# A document without a werkgebied\n");
    const wrong = [
      "docs/gone.md",
      "docs/plain.md",
      `./${DOC}`,
      DOC.replace(/\//g, "\\"),
      DOC.replace("balance", "Balance"),
    ];
    writeRegister(root, [{ id: "DFT-001", status: "resolved", documenten: [DOC, ...wrong], getoetstTegen: head(root) }]);
    commit(root, "book a DFT with paths written differently");
    const { documents, problems } = findDrift(root);
    const named = problems.map((problem) => {
      const match = problem.match(
        /^drift: DFT-001 .* names (.*) under documenten, which docs:drift does not track \(write the path exactly as docs:drift lists it; a document without a werkgebied cannot be booked here\)$/,
      );
      assert.ok(match, problem);
      return match[1];
    });
    assert.deepEqual(named, wrong);
    assert.equal(documents[0].baseline.dft, "DFT-001");
  });

  it("reports documenten written as a flow list", () => {
    const root = makeRepo();
    const checked = head(root);
    write(
      root,
      REGISTER,
      `dfts:\n  - id: "DFT-001"\n    status: resolved\n    documenten: [${DOC}]\n    getoetst-tegen: ${checked}\n    bestand: dft-001-test.md\n`,
    );
    commit(root, "book a DFT with a flow list");
    const { problems } = findDrift(root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /DFT-001 .* lists documenten inline \(\[docs\/grootboek\/balance\.md\]\); use a block list/);
  });

  it("reports a getoetst-tegen that is not a commit hash, without handing it to git", () => {
    const root = makeRepo();
    writeRegister(root, [
      { id: "DFT-001", status: "resolved", documenten: [DOC], getoetstTegen: "--output=x" },
      { id: "DFT-002", status: "resolved", documenten: [DOC], getoetstTegen: "main" },
    ]);
    commit(root, "book two DFTs with something other than a hash");
    const { problems } = findDrift(root);
    assert.equal(problems.length, 2);
    assert.match(problems[0], /DFT-001 .* has getoetst-tegen --output=x, which is not a commit hash$/);
    assert.match(problems[1], /DFT-002 .* has getoetst-tegen main, which is not a commit hash$/);
    // git log --output would have written a file into the repo.
    assert.equal(git(root, "status", "--porcelain"), "");
  });

  it("reports a hash git cannot resolve, also for a DFT that is still open", () => {
    const root = makeRepo();
    writeRegister(root, [{ id: "DFT-001", status: "open", documenten: [DOC], getoetstTegen: "deadbeef" }]);
    commit(root, "book an open DFT with a hash that does not exist");
    const { problems } = findDrift(root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /DFT-001 .* has getoetst-tegen deadbeef, which git cannot resolve to a commit$/);
  });

  it("reports a resolved DFT with documenten but no getoetst-tegen, and not one in progress", () => {
    const root = makeRepo();
    writeRegister(root, [
      { id: "DFT-001", status: "resolved", documenten: [DOC] },
      { id: "DFT-002", status: "in_progress", documenten: [DOC] },
    ]);
    commit(root, "book two DFTs without getoetst-tegen");
    const { problems } = findDrift(root);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /^drift: DFT-001 .* is resolved and lists documenten but has no getoetst-tegen$/);
  });

  it("accepts a resolved DFT without documenten and without getoetst-tegen, like DFT-001 and DFT-002", () => {
    const root = makeRepo();
    write(
      root,
      REGISTER,
      'dfts:\n  - id: "DFT-001"\n    titel: "A DFT about something else"\n    status: resolved\n    datum: 2026-10-21\n    bestand: dft-001-test.md\n',
    );
    commit(root, "book a DFT that is not about a leading document");
    assert.deepEqual(findDrift(root).problems, []);
  });
});

describe("a DFT that stays open", () => {
  // Today is passed in: no clock, so the boundary is exact.
  const TODAY = "2026-11-11";

  function dft(id, status, datum) {
    return { id, status, datum, documenten: [], documentenInline: null, getoetstTegen: null };
  }

  it("is quiet at 14 days and warns at 15", () => {
    assert.deepEqual(findStaleDfts([dft("DFT-001", "in_progress", "2026-10-28")], TODAY), []);
    assert.deepEqual(findStaleDfts([dft("DFT-002", "in_progress", "2026-10-27")], TODAY), [
      "dft: DFT-002 is still in_progress 15 days after it was opened (2026-10-27); this warns until it is resolved. " +
        "If it has to stay open, say why in the record.",
    ]);
  });

  it("counts whole days across a daylight saving change", () => {
    // Summer time starts in Amsterdam on 2026-03-29: in local time that span is an hour short.
    // The timezone is set here so that a local-time count fails in CI (UTC) too.
    const previousTimeZone = process.env.TZ;
    process.env.TZ = "Europe/Amsterdam";
    try {
      const opened = [dft("DFT-001", "open", "2026-03-29")];
      assert.deepEqual(findStaleDfts(opened, "2026-04-12"), []);
      assert.equal(findStaleDfts(opened, "2026-04-13").length, 1);
    } finally {
      if (previousTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = previousTimeZone;
      }
    }
  });

  it("warns for open and for in_progress", () => {
    const warnings = findStaleDfts(
      [dft("DFT-001", "open", "2026-10-01"), dft("DFT-002", "in_progress", "2026-10-01")],
      TODAY,
    );
    assert.equal(warnings.length, 2);
    assert.match(warnings[0], /^dft: DFT-001 is still open 41 days after it was opened \(2026-10-01\)/);
    assert.match(warnings[1], /^dft: DFT-002 is still in_progress 41 days after it was opened \(2026-10-01\)/);
  });

  it("never warns for a resolved DFT, even at 30 days", () => {
    assert.deepEqual(findStaleDfts([dft("DFT-001", "resolved", "2026-10-12")], TODAY), []);
  });

  it("skips a DFT without a datum, or with one that is not a date, without crashing", () => {
    assert.deepEqual(
      findStaleDfts([dft("DFT-001", "open", null), dft("DFT-002", "open", "last week")], TODAY),
      [],
    );
  });

  it("reads datum from the register", () => {
    const entries = parseDftRegister('dfts:\n  - id: "DFT-003"\n    status: in_progress\n    datum: 2026-10-27\n');
    assert.equal(findStaleDfts(entries, TODAY).length, 1);
  });
});
