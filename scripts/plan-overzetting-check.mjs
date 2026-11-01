// Completeness check for moving docs/plan.md into the grootboek (HDR-015, spec
// plan-overzetting). Run with `npm run docs:plan-check`; exits 1 until nothing is left over.
//
// The plan's decisions, decision-log rows and open questions get an id by position: D1.. for
// the Decisions table, L1.. for the decision log, Q<number> for the open questions. A record
// claims the rows it comes from in a "## Herkomst" section (`- L12 (09-30) first words`). A row
// that does not move gets a bullet with a reason under "## Vervalt", or under
// "## Staat al elders" when the grootboek already holds it. Every id has to be claimed exactly
// once. Every `##` heading of the plan also has to appear in the spec, which maps the sections
// that carry no ids. The check is temporary: it goes when docs/plan.md goes.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const PLAN_PATH = "docs/plan.md";
const SPEC_PATH = "docs/grootboek/specs/plan-overzetting.md";
const RECORD_FOLDERS = [
  "docs/grootboek/adr",
  "docs/grootboek/hdr",
  "docs/grootboek/pdr",
  "docs/grootboek/dft",
  "docs/grootboek/journaal",
];
const CLAIM_SECTIONS = new Set(["herkomst", "vervalt", "staat al elders"]);
const SECTIONS_THAT_NEED_A_REASON = new Set(["vervalt", "staat al elders"]);
const PREFIXES = ["D", "L", "Q"];
const LABEL_LENGTH = 70;

function splitLines(text) {
  return text.split(/\r?\n/);
}

// The lines under `## title`, up to the next `## ` heading.
function sectionBody(lines, title) {
  const start = lines.findIndex((line) => line === `## ${title}`);
  if (start < 0) {
    return [];
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  if (end < 0) {
    return rest;
  }
  return rest.slice(0, end);
}

// A markdown table starts with a header row and a separator row; both are dropped.
function tableRows(lines) {
  return lines.filter((line) => line.startsWith("|")).slice(2);
}

function rowLabel(row) {
  return row.replace(/^\|\s*/, "").slice(0, LABEL_LENGTH);
}

export function parsePlanIds(planText) {
  const lines = splitLines(planText);

  const decisions = tableRows(sectionBody(lines, "Decisions")).map((row, index) => ({
    id: `D${index + 1}`,
    label: rowLabel(row),
  }));

  const logRows = sectionBody(lines, "Decision log").filter((line) => /^\| ?\d{2}-\d{2} /.test(line));
  const log = logRows.map((row, index) => ({ id: `L${index + 1}`, label: rowLabel(row) }));

  const questions = sectionBody(lines, "Open questions").flatMap((line) => {
    const question = line.match(/^(\d{1,2})\. \*\*(.+?)\*\*/);
    if (!question) {
      return [];
    }
    return [{ id: `Q${question[1]}`, label: question[2] }];
  });

  return [...decisions, ...log, ...questions];
}

export function planHeadings(planText) {
  return splitLines(planText).flatMap((line) => {
    const heading = line.match(/^## (.+?)\s*$/);
    if (!heading) {
      return [];
    }
    return [heading[1]];
  });
}

// The bullets in a document's claim sections: `- L12 (09-30) text` or `- L5 — reason`.
export function parseClaims(text, path) {
  const claims = [];
  let section = "";
  for (const line of splitLines(text)) {
    const heading = line.match(/^## (.+?)\s*$/);
    if (heading) {
      section = heading[1].toLowerCase();
      continue;
    }
    if (!CLAIM_SECTIONS.has(section)) {
      continue;
    }
    const claim = line.match(/^- ([DLQ]\d+)\b(.*)$/);
    if (claim) {
      claims.push({ id: claim[1], section, note: claim[2].replace(/^[\s—–-]+/, "").trim(), path });
    }
  }
  return claims;
}

// `L1, L2, L3, L5` becomes `L1-L3, L5`, so a long list of unclaimed rows stays readable.
export function compressIds(ids) {
  const groups = [];
  for (const id of ids) {
    const prefix = id[0];
    const number = Number(id.slice(1));
    const last = groups[groups.length - 1];
    if (last && last.prefix === prefix && last.end + 1 === number) {
      last.end = number;
      continue;
    }
    groups.push({ prefix, start: number, end: number });
  }
  return groups.map((group) => {
    if (group.start === group.end) {
      return `${group.prefix}${group.start}`;
    }
    return `${group.prefix}${group.start}-${group.prefix}${group.end}`;
  });
}

// documents: the records to read, as { path, text }. The spec is read for claims too, because
// "Vervalt" and "Staat al elders" live there.
export function checkOverzetting({ planText, specText, documents }) {
  const planIds = parsePlanIds(planText);
  const knownIds = new Set(planIds.map((row) => row.id));
  const claims = [
    ...parseClaims(specText, SPEC_PATH),
    ...documents.flatMap((document) => parseClaims(document.text, document.path)),
  ];

  const claimsById = new Map();
  for (const claim of claims) {
    claimsById.set(claim.id, [...(claimsById.get(claim.id) ?? []), claim]);
  }

  const problems = [];

  for (const claim of claims) {
    if (!knownIds.has(claim.id)) {
      problems.push(`${claim.path} claims ${claim.id}, which is not a row of the plan`);
    }
    if (SECTIONS_THAT_NEED_A_REASON.has(claim.section) && claim.note === "") {
      problems.push(`${claim.path}: ${claim.id} under "${claim.section}" has no reason`);
    }
  }

  for (const [id, idClaims] of claimsById) {
    if (idClaims.length > 1) {
      const where = idClaims.map((claim) => claim.path).join(", ");
      problems.push(`${id} is claimed ${idClaims.length} times: ${where}`);
    }
  }

  const specSaysItOverHeading = (title) => specText.includes(title.split(" (")[0]);
  for (const title of planHeadings(planText)) {
    if (!specSaysItOverHeading(title)) {
      problems.push(`the plan heading "${title}" is not in the spec`);
    }
  }

  const missingIds = planIds.filter((row) => !claimsById.has(row.id)).map((row) => row.id);
  const counts = PREFIXES.map((prefix) => {
    const ids = planIds.filter((row) => row.id.startsWith(prefix));
    return {
      prefix,
      total: ids.length,
      claimed: ids.filter((row) => claimsById.has(row.id)).length,
    };
  });

  return { counts, missingIds, problems };
}

function listMarkdownFiles(dir) {
  if (!existsSync(join(ROOT, dir))) {
    return [];
  }
  return readdirSync(join(ROOT, dir))
    .filter((entry) => entry.endsWith(".md"))
    .map((entry) => `${dir}/${entry}`);
}

function main() {
  if (!existsSync(join(ROOT, PLAN_PATH))) {
    console.log(`${PLAN_PATH} is gone; this check has done its job and can be removed.`);
    return 0;
  }

  const read = (path) => readFileSync(join(ROOT, path), "utf8");
  const documents = RECORD_FOLDERS.flatMap(listMarkdownFiles).map((path) => ({ path, text: read(path) }));
  const result = checkOverzetting({ planText: read(PLAN_PATH), specText: read(SPEC_PATH), documents });

  for (const count of result.counts) {
    console.log(`${count.prefix}  ${count.claimed}/${count.total} claimed`);
  }
  if (result.missingIds.length > 0) {
    console.log(`unclaimed: ${compressIds(result.missingIds).join(", ")}`);
  }
  for (const problem of result.problems) {
    console.log(`problem: ${problem}`);
  }

  const nothingIsLeft = result.missingIds.length === 0 && result.problems.length === 0;
  return nothingIsLeft ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
