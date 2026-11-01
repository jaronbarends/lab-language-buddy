// Tests for the completeness check of the plan.md migration (HDR-015). Run with
// `npm run test:scripts`. Everything is passed in as text, so no files are touched.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkOverzetting, compressIds, parseClaims, parsePlanIds } from "./plan-overzetting-check.mjs";

const PLAN = [
  "# Plan",
  "",
  "## Context",
  "",
  "text",
  "",
  "## Decisions",
  "",
  "| Decision | Choice | Why |",
  "|---|---|---|",
  "| Framework | Next.js | brief |",
  "| Hosting | Vercel | free |",
  "",
  "---",
  "",
  "## Open questions",
  "",
  "1. **Evaluation design** — decided.",
  "   continuation line",
  "2. **Tests.** None yet.",
  "",
  "## Decision log",
  "",
  "| Date | Source | Change | Why |",
  "|---|---|---|---|",
  "| 09-23 | you | App scaffolded | Answered. |",
  "| 09-24 | agent | Flags | Windows. |",
  "| 09-25 | you | Something | Because. |",
  "",
].join("\r\n");

const SPEC = "## Context\n\n## Decisions\n\n## Open questions\n\n## Decision log\n";

const COMPLETE = [
  { path: "docs/grootboek/adr/adr-005-x.md", text: "# ADR-005\n\n## Herkomst\n\n- D1\n- D2\n- Q1 (decided)\n" },
  { path: "docs/grootboek/pdr/pdr-002-x.md", text: "# PDR-002\n\n## Herkomst\n\n- L1 (09-23) App scaffolded\n- L2\n" },
  { path: "docs/grootboek/hdr/hdr-020-x.md", text: "# HDR-020\n\n## Herkomst\n\n- Q2\n- L3\n" },
];

describe("reading the plan", () => {
  it("numbers the decisions, log rows and questions by position", () => {
    const ids = parsePlanIds(PLAN).map((row) => row.id);
    assert.deepEqual(ids, ["D1", "D2", "L1", "L2", "L3", "Q1", "Q2"]);
  });

  it("takes the question number from the text", () => {
    const questions = parsePlanIds(PLAN).filter((row) => row.id.startsWith("Q"));
    assert.deepEqual(questions.map((row) => row.id), ["Q1", "Q2"]);
  });
});

describe("a complete migration", () => {
  it("has no problems and nothing unclaimed", () => {
    const result = checkOverzetting({ planText: PLAN, specText: SPEC, documents: COMPLETE });
    assert.deepEqual(result.problems, []);
    assert.deepEqual(result.missingIds, []);
  });

  it("counts claimed against total per kind", () => {
    const result = checkOverzetting({ planText: PLAN, specText: SPEC, documents: COMPLETE });
    assert.deepEqual(result.counts, [
      { prefix: "D", total: 2, claimed: 2 },
      { prefix: "L", total: 3, claimed: 3 },
      { prefix: "Q", total: 2, claimed: 2 },
    ]);
  });
});

describe("what goes wrong", () => {
  it("lists a row nobody claimed", () => {
    const result = checkOverzetting({ planText: PLAN, specText: SPEC, documents: COMPLETE.slice(0, 2) });
    assert.deepEqual(result.missingIds, ["L3", "Q2"]);
  });

  it("names both files when a row is claimed twice", () => {
    const twice = [...COMPLETE, { path: "docs/grootboek/adr/adr-006-y.md", text: "## Herkomst\n\n- D1\n" }];
    const result = checkOverzetting({ planText: PLAN, specText: SPEC, documents: twice });
    assert.equal(result.problems.length, 1);
    assert.match(result.problems[0], /D1 is claimed 2 times: .*adr-005-x\.md, .*adr-006-y\.md/);
  });

  it("flags an id that is not a row of the plan", () => {
    const unknown = [...COMPLETE, { path: "docs/grootboek/adr/adr-006-y.md", text: "## Herkomst\n\n- L99\n" }];
    const result = checkOverzetting({ planText: PLAN, specText: SPEC, documents: unknown });
    assert.match(result.problems[0], /claims L99, which is not a row of the plan/);
  });

  it("asks for a reason under Vervalt, and accepts one", () => {
    const withoutReason = "## Vervalt\n\n- Q2\n";
    const withReason = "## Vervalt\n\n- Q2 — superseded by the evaluation ADR\n";
    const documents = COMPLETE.filter((document) => !document.text.includes("- Q2"));
    const rest = { path: "docs/grootboek/hdr/hdr-020-x.md", text: "## Herkomst\n\n- L3\n" };
    const bad = checkOverzetting({ planText: PLAN, specText: SPEC + withoutReason, documents: [...documents, rest] });
    const good = checkOverzetting({ planText: PLAN, specText: SPEC + withReason, documents: [...documents, rest] });
    assert.match(bad.problems[0], /Q2 under "vervalt" has no reason/);
    assert.deepEqual(good.problems, []);
  });

  it("flags a plan heading the spec does not mention", () => {
    const result = checkOverzetting({ planText: PLAN, specText: "## Decisions\n", documents: COMPLETE });
    assert.ok(result.problems.some((problem) => problem.includes('"Context"')));
  });

  it("ignores bullets outside the claim sections", () => {
    const claims = parseClaims("## Gevolgen\n\n- L1 is mentioned here\n", "x.md");
    assert.deepEqual(claims, []);
  });
});

describe("compressing ids", () => {
  it("joins runs and keeps gaps and kinds apart", () => {
    assert.deepEqual(compressIds(["D1", "D2", "D3", "L1", "L3", "L4"]), ["D1-D3", "L1", "L3-L4"]);
  });
});
