// The incident register (REQ-GG-06): recurring faults are logged by pattern and counted. Once
// is an incident, twice is chance, three times is a weakness of the harness: at three, the
// pattern should be codified (a rule, hook or skill) and booked as an HDR.
//
//   npm run docs:incidents
//
// The register is docs/grootboek/registers/incident-register.yml, grouped by pattern, with no
// ids (an incident is a line, not a decision), so two branches cannot collide on a number.
// Read by docs:check: a pattern at the threshold without a `maatregel` is a warning, a
// malformed register or a `maatregel` naming an HDR that does not exist is an error.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseRegister } from "./records.mjs";

export const THRESHOLD = 3;
const REGISTER = "docs/grootboek/registers/incident-register.yml";
const HDR_REGISTER = "docs/grootboek/registers/hdr-register.yml";

function unquote(raw) {
  const value = raw.trim();
  if (value.startsWith('"')) {
    const end = value.indexOf('"', 1);
    return end > 0 ? value.slice(1, end) : value.slice(1);
  }
  return value.replace(/\s+#.*$/, "").trim();
}

// A regex reader, like the record registers: there is no YAML dependency in this repo.
export function parseIncidents(text) {
  const patterns = [];
  let pattern = null;
  let incident = null;
  for (const line of text.split(/\r?\n/)) {
    const patternStart = line.match(/^  - patroon:\s*(.*)$/);
    if (patternStart) {
      pattern = { patroon: unquote(patternStart[1]), titel: null, maatregel: null, incidenten: [] };
      patterns.push(pattern);
      incident = null;
      continue;
    }
    if (!pattern) {
      continue;
    }
    const incidentStart = line.match(/^      - (datum|aantal|wat|bron):\s*(.*)$/);
    if (incidentStart) {
      incident = { datum: "", aantal: 1, wat: "", bron: "" };
      pattern.incidenten.push(incident);
      setIncidentField(incident, incidentStart[1], unquote(incidentStart[2]));
      continue;
    }
    const incidentField = line.match(/^        (datum|aantal|wat|bron):\s*(.*)$/);
    if (incidentField && incident) {
      setIncidentField(incident, incidentField[1], unquote(incidentField[2]));
      continue;
    }
    const patternField = line.match(/^    (titel|maatregel):\s*(.*)$/);
    if (patternField) {
      const value = unquote(patternField[2]);
      pattern[patternField[1]] = value === "" || value === "null" ? null : value;
    }
  }
  return patterns;
}

function setIncidentField(incident, field, value) {
  incident[field] = field === "aantal" ? Number(value) : value;
}

export function analyseIncidents(root) {
  const errors = [];
  const warnings = [];
  const registerPath = join(root, REGISTER);
  if (!existsSync(registerPath)) {
    return { patterns: [], errors, warnings };
  }
  const patterns = parseIncidents(readFileSync(registerPath, "utf8"));
  const hdrPath = join(root, HDR_REGISTER);
  const hdrIds = new Set(
    existsSync(hdrPath) ? parseRegister(readFileSync(hdrPath, "utf8")).map((entry) => entry.id) : [],
  );
  const seen = new Set();
  const analysed = patterns.map((pattern) => {
    if (!pattern.patroon) {
      errors.push("incidents: a pattern has no name");
    } else if (seen.has(pattern.patroon)) {
      errors.push(`incidents: pattern ${pattern.patroon} appears more than once`);
    }
    seen.add(pattern.patroon);
    let count = 0;
    for (const incident of pattern.incidenten) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(incident.datum)) {
        errors.push(`incidents: ${pattern.patroon} has an incident without a valid datum`);
      }
      if (!incident.wat) {
        errors.push(`incidents: ${pattern.patroon} has an incident without wat`);
      }
      if (!Number.isInteger(incident.aantal) || incident.aantal < 1) {
        errors.push(`incidents: ${pattern.patroon} has an incident whose aantal is not a whole number of 1 or more`);
      } else {
        count += incident.aantal;
      }
    }
    if (pattern.maatregel && !hdrIds.has(pattern.maatregel)) {
      errors.push(`incidents: ${pattern.patroon} names ${pattern.maatregel} as maatregel, which is not in the HDR register`);
    }
    if (count >= THRESHOLD && !pattern.maatregel) {
      warnings.push(
        `incidents: ${pattern.patroon} has ${count} incident(s) and no maatregel; ` +
          "codify it (a rule, hook or skill) and book an HDR",
      );
    }
    return { ...pattern, count };
  });
  return { patterns: analysed, errors, warnings };
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const { patterns, errors, warnings } = analyseIncidents(root);
  if (patterns.length === 0) {
    console.log("incidents: the register is empty or missing.");
  }
  for (const pattern of patterns) {
    const state = pattern.maatregel
      ? `codified in ${pattern.maatregel}`
      : pattern.count >= THRESHOLD
        ? `NOT CODIFIED, threshold ${THRESHOLD} reached`
        : `${THRESHOLD - pattern.count} more before it counts as a weakness`;
    console.log(`${pattern.patroon.padEnd(24)} ${String(pattern.count).padStart(3)}  ${state}`);
  }
  for (const warning of warnings) {
    console.warn(`warning  ${warning}`);
  }
  for (const error of errors) {
    console.error(`ERROR    ${error}`);
  }
  process.exit(errors.length > 0 ? 1 : 0);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
