// Tests for the incident register and its counter. Run with `npm run test:scripts`. Each test
// builds a small docs tree in a temp folder: an incident register and an HDR register.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, it } from "node:test";
import { analyseIncidents, parseIncidents } from "./incidents.mjs";

const REGISTER = "docs/grootboek/registers/incident-register.yml";
const HDR_REGISTER = "docs/grootboek/registers/hdr-register.yml";
const roots = [];

function makeRoot(incidentRegister, hdrIds = ["HDR-001"]) {
  const root = mkdtempSync(join(tmpdir(), "incidents-test-"));
  roots.push(root);
  write(root, REGISTER, incidentRegister);
  write(
    root,
    HDR_REGISTER,
    `hdrs:\n${hdrIds.map((id) => `  - id: "${id}"\n    bestand: ${id.toLowerCase()}-x.md\n`).join("")}`,
  );
  return root;
}

function write(root, path, text) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

function pattern(slug, incidents, extra = "") {
  const lines = incidents.map((incident) => {
    const aantal = incident.aantal ? `        aantal: ${incident.aantal}\n` : "";
    return `      - datum: ${incident.datum ?? "2026-10-10"}\n${aantal}        wat: ${incident.wat ?? '"something went wrong"'}\n`;
  });
  return `  - patroon: ${slug}\n    titel: "A title"\n${extra}    incidenten:\n${lines.join("")}`;
}

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop(), { recursive: true, force: true });
  }
});

describe("reading the register", () => {
  it("reads patterns, incidents, quotes and trailing comments", () => {
    const text =
      'patronen:\n  - patroon: naming   # a slug\n    titel: "A name: a promise"\n    maatregel: HDR-010   # codified\n' +
      '    incidenten:\n      - datum: 2026-10-10\n        aantal: 7\n        wat: "seven # names"\n        bron: "stage 4"\n';
    const [parsed] = parseIncidents(text);
    assert.equal(parsed.patroon, "naming");
    assert.equal(parsed.titel, "A name: a promise");
    assert.equal(parsed.maatregel, "HDR-010");
    assert.deepEqual(parsed.incidenten, [{ datum: "2026-10-10", aantal: 7, wat: "seven # names", bron: "stage 4" }]);
  });

  it("treats an empty maatregel as none", () => {
    assert.equal(parseIncidents("patronen:\n  - patroon: a\n    maatregel:\n")[0].maatregel, null);
  });
});

describe("counting against the threshold of three", () => {
  it("is quiet at two incidents", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{}, {}])}`);
    const { patterns, warnings, errors } = analyseIncidents(root);
    assert.equal(patterns[0].count, 2);
    assert.deepEqual(warnings, []);
    assert.deepEqual(errors, []);
  });

  it("warns at three uncodified incidents", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{}, {}, {}])}`);
    const { warnings } = analyseIncidents(root);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /a has 3 incident\(s\) and no maatregel/);
  });

  it("counts aantal as its value", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{ aantal: 7 }])}`);
    const { patterns, warnings } = analyseIncidents(root);
    assert.equal(patterns[0].count, 7);
    assert.equal(warnings.length, 1);
  });

  it("is quiet when the pattern is codified in an HDR that exists", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{ aantal: 7 }], "    maatregel: HDR-009\n")}`, ["HDR-001", "HDR-009"]);
    const { warnings, errors } = analyseIncidents(root);
    assert.deepEqual(warnings, []);
    assert.deepEqual(errors, []);
  });
});

describe("errors", () => {
  it("rejects a maatregel naming an HDR that is not there", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{}], "    maatregel: HDR-099\n")}`);
    assert.match(analyseIncidents(root).errors.join("\n"), /HDR-099 as maatregel, which is not in the HDR register/);
  });

  it("rejects a duplicate pattern", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{}])}${pattern("a", [{}])}`);
    assert.match(analyseIncidents(root).errors.join("\n"), /pattern a appears more than once/);
  });

  it("rejects an incident without a datum, without wat, or with a bad aantal", () => {
    const root = makeRoot(
      `patronen:\n  - patroon: a\n    incidenten:\n      - wat: "no date"\n      - datum: 2026-10-10\n      - datum: 2026-10-10\n        aantal: 0\n        wat: "zero"\n`,
    );
    const errors = analyseIncidents(root).errors.join("\n");
    assert.match(errors, /without a valid datum/);
    assert.match(errors, /without wat/);
    assert.match(errors, /aantal is not a whole number/);
  });
});

describe("a missing register", () => {
  it("is not an error", () => {
    const root = mkdtempSync(join(tmpdir(), "incidents-test-"));
    roots.push(root);
    assert.deepEqual(analyseIncidents(root), { patterns: [], errors: [], warnings: [] });
  });
});
