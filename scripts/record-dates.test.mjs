// Tests for the check that no record is dated after today (HDR-012). Run with
// `npm run test:scripts`. Each test builds a small docs/grootboek tree in a temp folder and
// passes "today" in, so the result never depends on the clock.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { checkRecordDates, todayInAmsterdam } from "./records.mjs";

const TODAY = "2026-10-27";
const roots = [];

function makeRoot(files) {
  const root = mkdtempSync(join(tmpdir(), "record-dates-test-"));
  roots.push(root);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop(), { recursive: true, force: true });
  }
});

describe("dates that are fine", () => {
  it("accepts today, the past and a file without dates", () => {
    const root = makeRoot({
      "docs/grootboek/registers/hdr-register.yml": 'hdrs:\n  - id: "HDR-001"\n    datum: 2026-10-27\n    implementatie-datum: 2026-10-20\n',
      "docs/grootboek/hdr/hdr-001-x.md": "# HDR-001\n\n- **Date:** 2026-10-27\n",
      "docs/grootboek/specs/x.md": "---\ntitel: x\ndatum: 27 oktober 2026\n---\n",
      "docs/grootboek/adr/none.md": "# no dates here\n",
    });
    assert.deepEqual(checkRecordDates(root, TODAY), []);
  });

  it("is quiet when there is no grootboek folder", () => {
    assert.deepEqual(checkRecordDates(makeRoot({}), TODAY), []);
  });

  it("does not look at a date in running prose or deep in a document", () => {
    const filler = Array.from({ length: 30 }, (_, index) => `line ${index}`).join("\n");
    const root = makeRoot({
      "docs/grootboek/hdr/hdr-001-x.md": `# HDR-001\n\nSeeded on 2026-12-01 in the text.\n${filler}\n- **Date:** 2026-12-01\n`,
    });
    assert.deepEqual(checkRecordDates(root, TODAY), []);
  });
});

describe("a date after today", () => {
  it("is caught in a register, including the day-ahead mistake that was made once", () => {
    const root = makeRoot({
      "docs/grootboek/registers/hdr-register.yml": 'hdrs:\n  - id: "HDR-009"\n    datum: 2026-10-28\n    implementatie-datum: 2026-10-28\n',
    });
    const problems = checkRecordDates(root, TODAY);
    assert.equal(problems.length, 2);
    assert.match(problems[0], /hdr-register\.yml:3 is dated 2026-10-28, after today \(2026-10-27\)/);
  });

  it("is caught in the Date line of a record, in front matter and in a Dutch spec date", () => {
    const root = makeRoot({
      "docs/grootboek/hdr/hdr-009-x.md": "# HDR-009\n\n- **Date:** 2026-10-28\n",
      "docs/grootboek/journaal/jnl-002-x.md": "---\ntitel: x\ndatum: 2026-10-28\n---\n",
      "docs/grootboek/specs/x.md": "---\ntitel: x\ndatum: 28 oktober 2026\n---\n",
    });
    assert.equal(checkRecordDates(root, TODAY).length, 3);
  });

  it("is caught in an incident of the incident register", () => {
    const root = makeRoot({
      "docs/grootboek/registers/incident-register.yml": "patronen:\n  - patroon: a\n    incidenten:\n      - datum: 2026-10-28\n        wat: x\n",
    });
    assert.equal(checkRecordDates(root, TODAY).length, 1);
  });
});

describe("today", () => {
  it("is read as a YYYY-MM-DD date in the Amsterdam timezone, not in UTC", () => {
    assert.match(todayInAmsterdam(), /^\d{4}-\d{2}-\d{2}$/);
    // 23:30 UTC on 27 October is already 28 October in Amsterdam (UTC+1 after the clocks change).
    assert.equal(todayInAmsterdam(new Date("2026-10-27T23:30:00Z")), "2026-10-28");
    assert.equal(todayInAmsterdam(new Date("2026-10-27T12:00:00Z")), "2026-10-27");
  });
});
