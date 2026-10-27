// Shared by check-docs.mjs and renumber-records.mjs: where the grootboek records and their
// registers live, how to read a register, and the problems a register can have.
import { existsSync, readFileSync } from "node:fs";
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
