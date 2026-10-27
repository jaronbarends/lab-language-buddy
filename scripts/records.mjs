// Shared by check-docs.mjs and renumber-records.mjs: where the grootboek records and their
// registers live, how to read a register, and the problems a register can have.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// One entry per record type: the id prefix, the register and the folder its files live in.
export const RECORD_TYPES = [
  { prefix: "ADR", register: "docs/grootboek/registers/adr-register.yml", folder: "docs/grootboek/adr" },
  { prefix: "HDR", register: "docs/grootboek/registers/hdr-register.yml", folder: "docs/grootboek/hdr" },
  { prefix: "PDR", register: "docs/grootboek/registers/pdr-register.yml", folder: "docs/grootboek/pdr" },
  { prefix: "DFT", register: "docs/grootboek/registers/dft-register.yml", folder: "docs/grootboek/dft" },
  { prefix: "JNL", register: "docs/grootboek/registers/jnl-register.yml", folder: "docs/grootboek/journaal" },
];

// The registers are flat lists of `- id: "HDR-006"` entries whose fields are indented below.
// A regex is enough; there is no YAML dependency in this repo.
export function parseRegister(text) {
  const entries = [];
  for (const line of text.split(/\r?\n/)) {
    const idMatch = line.match(/^\s*- id: "([A-Z]{3}-\d{3})"/);
    if (idMatch) {
      entries.push({ id: idMatch[1], bestand: null });
      continue;
    }
    const fileMatch = line.match(/^\s+bestand: (\S+)/);
    if (fileMatch && entries.length > 0 && entries[entries.length - 1].bestand === null) {
      entries[entries.length - 1].bestand = fileMatch[1];
    }
  }
  return entries;
}

export function idNumber(id) {
  return Number(id.slice(4));
}

export function formatId(prefix, number) {
  return `${prefix}-${String(number).padStart(3, "0")}`;
}

// What check-docs.mjs reports: a duplicated id, a missing record file, a file name that does
// not start with its own id in lowercase.
export function checkRecords(root) {
  const problems = [];
  for (const type of RECORD_TYPES) {
    const registerPath = join(root, type.register);
    if (!existsSync(registerPath)) {
      continue;
    }
    const seen = new Set();
    for (const entry of parseRegister(readFileSync(registerPath, "utf8"))) {
      if (seen.has(entry.id)) {
        problems.push(`records: ${entry.id} appears more than once in ${type.register}`);
      }
      seen.add(entry.id);
      if (!entry.bestand) {
        problems.push(`records: ${entry.id} in ${type.register} has no bestand`);
        continue;
      }
      if (!existsSync(join(root, type.folder, entry.bestand))) {
        problems.push(`records: ${entry.id} names ${entry.bestand}, which is not in ${type.folder}`);
      }
      if (!entry.bestand.startsWith(`${entry.id.toLowerCase()}-`)) {
        problems.push(`records: ${entry.bestand} should start with ${entry.id.toLowerCase()}-`);
      }
    }
  }
  return problems;
}

// A record that is dated after today was dated by assumption and not by the clock (HDR-012).
// "Today" is read in this timezone, not UTC: CI runs in UTC, and a record written just after
// midnight here would otherwise look like it comes from tomorrow.
const TIME_ZONE = "Europe/Amsterdam";
const DUTCH_MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];
const FRONT_LINES = 20;

export function todayInAmsterdam(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// The date a structured line carries, as YYYY-MM-DD, or null. Only structured fields count:
// the register fields, the front matter, the "- **Date:**" line of a record and the Dutch
// "datum: 27 oktober 2026" of a spec. A date in running prose is not looked at.
function dateOnLine(line) {
  const iso =
    line.match(/^\s*(?:- )?(?:datum|implementatie-datum|laatste-sessie):\s*(\d{4}-\d{2}-\d{2})\s*$/) ??
    line.match(/^- \*\*(?:Date|Implemented):\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (iso) {
    return iso[1];
  }
  const dutch = line.match(/^datum:\s*(\d{1,2}) (\p{L}+) (\d{4})\s*$/u);
  if (!dutch) {
    return null;
  }
  const month = DUTCH_MONTHS.indexOf(dutch[2].toLowerCase());
  if (month < 0) {
    return null;
  }
  return `${dutch[3]}-${String(month + 1).padStart(2, "0")}-${dutch[1].padStart(2, "0")}`;
}

function listGrootboekFiles(root, dir) {
  const found = [];
  for (const entry of readdirSync(join(root, dir))) {
    const path = `${dir}/${entry}`;
    if (statSync(join(root, path)).isDirectory()) {
      found.push(...listGrootboekFiles(root, path));
    } else if (entry.endsWith(".md") || entry.endsWith(".yml")) {
      found.push(path);
    }
  }
  return found;
}

export function checkRecordDates(root, today = todayInAmsterdam()) {
  const problems = [];
  const base = "docs/grootboek";
  if (!existsSync(join(root, base))) {
    return problems;
  }
  for (const path of listGrootboekFiles(root, base)) {
    const lines = readFileSync(join(root, path), "utf8").split(/\r?\n/);
    const checked = path.endsWith(".yml") ? lines : lines.slice(0, FRONT_LINES);
    checked.forEach((line, index) => {
      const date = dateOnLine(line);
      if (date && date > today) {
        problems.push(`records: ${path}:${index + 1} is dated ${date}, after today (${today})`);
      }
    });
  }
  return problems;
}
