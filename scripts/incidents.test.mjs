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
      "    beoordeeld-tot: 7   # judged\n" +
      '    incidenten:\n      - datum: 2026-10-10\n        aantal: 7\n        wat: "seven # names"\n        bron: "stage 4"\n';
    const [parsed] = parseIncidents(text);
    assert.equal(parsed.patroon, "naming");
    assert.equal(parsed.titel, "A name: a promise");
    assert.equal(parsed.maatregel, "HDR-010");
    assert.equal(parsed.beoordeeldTot, "7");
    assert.deepEqual(parsed.incidenten, [{ datum: "2026-10-10", aantal: 7, wat: "seven # names", bron: "stage 4" }]);
  });

  it("treats an empty maatregel as none", () => {
    assert.equal(parseIncidents("patronen:\n  - patroon: a\n    maatregel:\n")[0].maatregel, null);
  });

  it("treats an empty or null beoordeeld-tot as none", () => {
    const [empty, nulled] = parseIncidents(
      "patronen:\n  - patroon: a\n    beoordeeld-tot:\n  - patroon: b\n    beoordeeld-tot: null\n",
    );
    assert.equal(empty.beoordeeldTot, null);
    assert.equal(nulled.beoordeeldTot, null);
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
    const root = makeRoot(`patronen:\n${pattern("a", [{ aantal: 7 }], "    maatregel: HDR-009\n    beoordeeld-tot: 7\n")}`, [
      "HDR-001",
      "HDR-009",
    ]);
    const { warnings, errors } = analyseIncidents(root);
    assert.deepEqual(warnings, []);
    assert.deepEqual(errors, []);
  });
});

describe("errors", () => {
  it("rejects a maatregel naming an HDR that is not there", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{}], "    maatregel: HDR-099\n    beoordeeld-tot: 1\n")}`);
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

describe("judging incidents after the maatregel", () => {
  const HDR_IDS = ["HDR-001", "HDR-009"];

  function codified(beoordeeldTot) {
    return `    maatregel: HDR-009\n    beoordeeld-tot: ${beoordeeldTot}\n`;
  }

  it("warns when the count is above beoordeeld-tot", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{}, {}, {}], codified(2))}`, HDR_IDS);
    const { patterns, warnings, errors } = analyseIncidents(root);
    assert.equal(patterns[0].unjudged, 1);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /a has 1 incident\(s\) after beoordeeld-tot 2 under maatregel HDR-009/);
    assert.match(warnings[0], /ask Jarón whether HDR-009 held .* then raise beoordeeld-tot with his approval/);
    assert.deepEqual(errors, []);
  });

  it("is quiet when the count equals beoordeeld-tot", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{}, {}, {}], codified(3))}`, HDR_IDS);
    const { patterns, warnings, errors } = analyseIncidents(root);
    assert.equal(patterns[0].unjudged, 0);
    assert.deepEqual(warnings, []);
    assert.deepEqual(errors, []);
  });

  it("still warns at the threshold for a pattern without maatregel, and asks no beoordeeld-tot", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{}, {}, {}])}`, HDR_IDS);
    const { warnings, errors } = analyseIncidents(root);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /a has 3 incident\(s\) and no maatregel/);
    assert.deepEqual(errors, []);
  });

  it("rejects a maatregel without beoordeeld-tot", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{}], "    maatregel: HDR-009\n")}`, HDR_IDS);
    assert.match(analyseIncidents(root).errors.join("\n"), /a has a maatregel but no beoordeeld-tot/);
  });

  it("rejects beoordeeld-tot without a maatregel", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{}], "    beoordeeld-tot: 1\n")}`, HDR_IDS);
    assert.match(analyseIncidents(root).errors.join("\n"), /a has beoordeeld-tot but no maatregel/);
  });

  it("rejects a beoordeeld-tot that is not a whole number of 0 or more", () => {
    for (const value of ["two", "-1", "1.5", "0x1"]) {
      const root = makeRoot(`patronen:\n${pattern("a", [{}, {}], codified(value))}`, HDR_IDS);
      const { warnings, errors } = analyseIncidents(root);
      assert.match(errors.join("\n"), new RegExp(`beoordeeld-tot ${value}, which is not a whole number of 0 or more`));
      assert.deepEqual(warnings, []);
    }
  });

  it("rejects a beoordeeld-tot above the count", () => {
    const root = makeRoot(`patronen:\n${pattern("a", [{}, {}], codified(3))}`, HDR_IDS);
    const { warnings, errors } = analyseIncidents(root);
    assert.match(errors.join("\n"), /a has beoordeeld-tot 3, more than its 2 incident\(s\)/);
    assert.deepEqual(warnings, []);
  });
});

describe("a missing register", () => {
  it("is not an error", () => {
    const root = mkdtempSync(join(tmpdir(), "incidents-test-"));
    roots.push(root);
    assert.deepEqual(analyseIncidents(root), { patterns: [], errors: [], warnings: [] });
  });
});
