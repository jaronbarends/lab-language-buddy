#!/usr/bin/env node
'use strict';

// Stop hook (not wired in settings yet) for the incident pattern id-with-title: a numbered record
// is named by its bare id, so the reader has to look up what it is about. After a turn the hook
// reads the assistant's text from the transcript and blocks the stop when a record id lacks a
// short description where the reader first meets it. The check is loose on purpose: a few words
// after the id are enough; whether they match the title is not checked.
//
// Two kinds of unit:
//   prose        all assistant text of the session outside fenced blocks; an id needs a
//                description at its first mention in the session, later mentions may be bare
//   bare fence   each fenced block without an info string, read outside this session (a
//                startprompt or a hand-over); an id needs a description at its first mention in
//                that block, whatever the session said before
// Not checked: inline code, and fenced blocks with an info string (```diff, ```yaml), anywhere.
//
// Two modes:
//   hook (default)          reads the Stop hook input on stdin, including the closing message
//                           (last_assistant_message); no output at all when clean
//   --replay <transcript>   runs the check after every turn of a transcript, as if the hook had
//                           fired there, and prints a bounded report

const fs = require('fs');
const path = require('path');

const REGISTER_FOLDER = path.join(__dirname, '..', '..', 'docs', 'grootboek', 'registers');
const PREFIXES = ['ADR', 'HDR', 'PDR', 'DFT', 'JNL'];
const ID_PATTERN = /\b(?:ADR|HDR|PDR|DFT|JNL)-\d{3}\b/g;

// A word is a run of at least two letters, so "(v1.1)" or "(K7)" is no description. A word that
// starts an id is no description either, in any form: in "HDR-009, HDR-034 en HDR-035" every id
// stays bare.
const WORD = /\p{L}{2,}/u;
const NOT_AN_ID = '(?!(?:ADR|HDR|PDR|DFT|JNL)-\\d)';
// Markdown that may close right after the id or right after a separator (`**HDR-005**: ...`,
// `**HDR-005:** ...`, `[HDR-005](path): ...`), and open before the first word
// (`HDR-005: **De branch ...**`).
const CLOSING_MARKUP = '(?:[*_`]|\\]\\([^)\\s]*\\))*';
const OPENING_MARKUP = '[*_`"\'“”‘’„]*';
// The description may start on the directly following line, unless that line opens a fence. Without
// a separator or a parenthesis there, a colon that ends a line introduces a list, not a description.
const NEXT_LINE = '(?:\\r?\\n[ \\t]*(?!```))?';
const SEPARATOR_AFTER = new RegExp(
  `^${CLOSING_MARKUP}[ \\t]*[:—–,]${CLOSING_MARKUP}[ \\t]*${NEXT_LINE}${OPENING_MARKUP}${NOT_AN_ID}\\p{L}{2,}`,
  'u'
);
// Forms that enclose the description; the enclosed text needs a word. The text in a parenthesis or
// quotes may wrap, as it does in a hard-wrapped startprompt.
const PARENTHESIS_AFTER = new RegExp(`^${CLOSING_MARKUP}[ \\t]*${NEXT_LINE}\\(([^)]*)\\)`, 'u');
const QUOTE_AFTER = new RegExp(`^${CLOSING_MARKUP}[ \\t]*(?:"([^"]*)"|“([^”]*)”|'([^']*)')`, 'u');
const TABLE_CELL_AFTER = new RegExp(`^${CLOSING_MARKUP}[ \\t]*\\|([^|\\n]*)`, 'u');
// Inline code on one line: a run of backticks closed by a run of the same length.
const INLINE_CODE = /(?<!`)(`+)(?!`).+?(?<!`)\1(?!`)/g;

// Line kinds in classifyLines; a bare fence gets its own index (0 and up) instead.
const PROSE = -1;
const SKIP = -2;

const MAX_ROWS = 30;
const CONTEXT_BEFORE = 40;
const CONTEXT_AFTER = 60;

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

// --- Registers ---------------------------------------------------------------------------------

// scripts/records.mjs parses the registers, but only `id` and `bestand`, and it is ESM; a minimal
// parse of the `- id:` and `titel:` lines is enough here.
function loadTitles() {
  const titles = new Map();
  for (const prefix of PREFIXES) {
    let text;
    try {
      text = fs.readFileSync(path.join(REGISTER_FOLDER, `${prefix.toLowerCase()}-register.yml`), 'utf8');
    } catch {
      continue;
    }
    let currentId = null;
    for (const line of text.split(/\r?\n/)) {
      const idMatch = line.match(/^\s*- id: "([A-Z]{3}-\d{3})"/);
      if (idMatch) {
        currentId = idMatch[1];
        continue;
      }
      const titleMatch = line.match(/^\s+titel: "(.*)"\s*$/);
      if (titleMatch && currentId && !titles.has(currentId)) {
        titles.set(currentId, titleMatch[1].replace(/\\(["\\])/g, '$1'));
      }
    }
  }
  return titles;
}

function titleOf(titles, id) {
  return titles.get(id) || 'onbekend';
}

// --- Core --------------------------------------------------------------------------------------

function containsWord(text) {
  return WORD.test(text.replace(ID_PATTERN, ' '));
}

function enclosesWord(rest, pattern) {
  const match = rest.match(pattern);
  if (!match) {
    return false;
  }
  return containsWord(match.slice(1).find((group) => group !== undefined) ?? '');
}

// Whether the text right after an id starts with a description: a colon, dash or comma followed
// by a word; a quoted title or a parenthesis with a word; or, in a table row, a next cell with a
// word. A separator or a parenthesis may put the description on the next line. A parenthesis
// without a word ("JNL-002 (K7): ...") may still be followed by one.
function hasDescription(rest) {
  if (SEPARATOR_AFTER.test(rest) || enclosesWord(rest, QUOTE_AFTER) || enclosesWord(rest, TABLE_CELL_AFTER)) {
    return true;
  }
  const parenthesis = rest.match(PARENTHESIS_AFTER);
  if (!parenthesis) {
    return false;
  }
  if (containsWord(parenthesis[1])) {
    return true;
  }
  return SEPARATOR_AFTER.test(rest.slice(parenthesis[0].length));
}

function maskInlineCode(line) {
  return line.replace(INLINE_CODE, (code) => ' '.repeat(code.length));
}

// A fence opens on a line of at least three backticks; what follows is the info string, which may
// not contain a backtick. Without an info string the fence is bare.
function openingFence(line) {
  const match = line.match(/^[ \t]*(`{3,})([^`]*)$/);
  if (!match) {
    return null;
  }
  return { length: match[1].length, fenceIsBare: match[2].trim() === '' };
}

// The length of a closing fence (backticks only), or 0 when the line is none.
function closingLength(line) {
  const match = line.match(/^[ \t]*(`{3,})\s*$/);
  return match ? match[1].length : 0;
}

// Per line: PROSE, SKIP (a fence marker, or code in a fence with an info string), or the index of
// the bare fence it belongs to. A fence closes on a line of at least as many backticks; an unclosed
// fence runs to the end. Inside a bare fence a nested fence is followed one level deep: a nested
// block with an info string is code in the prompt and is skipped too.
function classifyLines(lines) {
  const kinds = [];
  let outer = null;
  let inner = null;
  let bareCount = 0;
  for (const line of lines) {
    if (!outer) {
      const open = openingFence(line);
      if (!open) {
        kinds.push(PROSE);
        continue;
      }
      outer = { ...open, index: open.fenceIsBare ? bareCount++ : SKIP };
      kinds.push(SKIP);
      continue;
    }
    const close = closingLength(line);
    if (close >= outer.length) {
      outer = null;
      inner = null;
      kinds.push(SKIP);
      continue;
    }
    if (!outer.fenceIsBare) {
      kinds.push(SKIP);
      continue;
    }
    if (inner) {
      if (close >= inner.length) {
        inner = null;
        kinds.push(SKIP);
        continue;
      }
      kinds.push(inner.fenceIsBare ? outer.index : SKIP);
      continue;
    }
    const open = openingFence(line);
    if (open) {
      inner = open;
      kinds.push(SKIP);
      continue;
    }
    kinds.push(outer.index);
  }
  return kinds;
}

// The units in one text block: its prose, and each bare fence. A unit is a copy of the text with
// everything outside it (and all inline code) blanked to spaces, so offsets stay those of the text.
function unitsOf(text) {
  const lines = text.split('\n');
  const kinds = classifyLines(lines);
  const masked = lines.map(maskInlineCode);
  function keep(kind) {
    return masked.map((line, index) => (kinds[index] === kind ? line : ' '.repeat(line.length))).join('\n');
  }
  const fences = [...new Set(kinds.filter((kind) => kind >= 0))];
  return [
    { kind: 'prose', fence: null, masked: keep(PROSE) },
    ...fences.map((index) => ({ kind: 'fence', fence: index, masked: keep(index) })),
  ];
}

// Every id in a unit, in order. The id is found in the masked unit; the description is read from
// the original text, so a description in inline code ("HDR-005 (`guard-merge`)") still counts.
function mentionsIn(unit, text) {
  return [...unit.masked.matchAll(ID_PATTERN)].map((match) => ({
    id: match[0],
    offset: match.index,
    idIsDescribed: hasDescription(text.slice(match.index + match[0].length)),
  }));
}

// Per turn, the bare mentions the hook would flag after that turn: in prose the first mention of an
// id in the session, in a bare fence the first mention in that block. A turn is a list of text
// blocks ({ lineNumber, text }).
function checkTurns(turns) {
  const seenInProse = new Set();
  return turns.map((blocks) =>
    blocks.flatMap((block) =>
      unitsOf(block.text).flatMap((unit) => {
        const seen = unit.kind === 'prose' ? seenInProse : new Set();
        return mentionsIn(unit, block.text).flatMap((mention) => {
          if (seen.has(mention.id)) {
            return [];
          }
          seen.add(mention.id);
          if (mention.idIsDescribed) {
            return [];
          }
          return [
            {
              ...mention,
              kind: unit.kind,
              unit: `${block.lineNumber}:${unit.fence}`,
              lineNumber: block.lineNumber,
              text: block.text,
            },
          ];
        });
      })
    )
  );
}

// --- Transcript --------------------------------------------------------------------------------

// Only lines that parse to an object count, so one stray line cannot silence the hook for the rest
// of the session.
function readTranscript(file) {
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .flatMap((line, index) => {
      if (!line.trim()) {
        return [];
      }
      try {
        const entry = JSON.parse(line);
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          return [];
        }
        return [{ lineNumber: index + 1, entry }];
      } catch {
        return [];
      }
    });
}

// A user entry starts a new turn unless it is a tool result (a `tool_result` content block, with
// `toolUseResult` beside it) or the companion of a tool call (a skill body written after a Skill
// tool_use: `isMeta` with `turnCompanion` and `sourceToolUseID`). A human prompt starts a turn,
// and so does a subagent hand-back: it is not the user, but the lead answers it in a turn of its
// own and the Stop hook fires at the end of that turn too.
function startsTurn(entry) {
  if (entry.type !== 'user' || entry.isSidechain) {
    return false;
  }
  const content = entry.message && entry.message.content;
  if (Array.isArray(content) && content.some((block) => block && block.type === 'tool_result')) {
    return false;
  }
  if (entry.toolUseResult !== undefined || entry.turnCompanion || entry.sourceToolUseID) {
    return false;
  }
  return true;
}

// Each assistant content block is its own transcript entry, so text between tool calls arrives
// as separate entries.
function textBlocksOf(record) {
  const { entry, lineNumber } = record;
  if (entry.type !== 'assistant' || entry.isSidechain) {
    return [];
  }
  const content = entry.message && entry.message.content;
  if (!Array.isArray(content)) {
    return [];
  }
  return content
    .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
    .map((block) => ({ lineNumber, text: block.text }));
}

// The assistant text per turn. The first element holds the text before the first turn starts
// (normally none); the last element is the current turn, even when it has no text yet.
function turnsOf(records) {
  const turns = [[]];
  for (const record of records) {
    if (startsTurn(record.entry)) {
      turns.push([]);
      continue;
    }
    turns[turns.length - 1].push(...textBlocksOf(record));
  }
  return turns;
}

// --- Hook mode ---------------------------------------------------------------------------------

function listOf(flags, titles) {
  return [...new Set(flags.map((flag) => flag.id))].map((id) => `${id} (${titleOf(titles, id)})`).join(', ');
}

function reasonFor(flags, titles) {
  const prose = flags.filter((flag) => flag.kind === 'prose');
  const fenced = flags.filter((flag) => flag.kind === 'fence');
  const parts = [];
  if (prose.length > 0) {
    parts.push(
      `Ids zonder omschrijving bij hun eerste vermelding in deze sessie: ${listOf(prose, titles)}. ` +
        'Stuur een korte aanvulling waarin je zegt waar ze over gaan.'
    );
  }
  if (fenced.length > 0) {
    const severalFencesAreFlagged = new Set(fenced.map((flag) => flag.unit)).size > 1;
    parts.push(
      severalFencesAreFlagged
        ? `Ids zonder omschrijving in codeblokken zonder taal (startprompts of overdrachten, gelezen buiten deze sessie): ${listOf(fenced, titles)}. ` +
            'Stuur die codeblokken opnieuw met een omschrijving bij die ids; een aanvulling eronder repareert ze niet.'
        : `Ids zonder omschrijving in een codeblok zonder taal (een startprompt of overdracht, gelezen buiten deze sessie): ${listOf(fenced, titles)}. ` +
            'Stuur het codeblok opnieuw met een omschrijving bij die ids; een aanvulling eronder repareert het niet.'
    );
  }
  return parts.join(' ');
}

// The Stop hook can fire before the closing message is on disk (seen live: some 15 ms after its
// timestamp, the transcript did not hold it yet). Claude Code passes that message in the input as
// last_assistant_message; it joins the last turn as its last text block, unless the transcript
// already ends with it.
function withClosingMessage(turns, message) {
  if (typeof message !== 'string' || message.trim() === '') {
    return turns;
  }
  const lastTurn = turns[turns.length - 1];
  const lastBlock = lastTurn[lastTurn.length - 1];
  if (lastBlock && lastBlock.text.trim() === message.trim()) {
    return turns;
  }
  return [...turns.slice(0, -1), [...lastTurn, { lineNumber: null, text: message }]];
}

// The hook's answer to a Stop input: a block decision, or null to let the stop through. Only what
// falls in the last turn is flagged; earlier turns had their own chance. The session history still
// comes from the transcript.
function hookResult(input) {
  // Already continuing because of a Stop hook: let it stop, or the addendum loops.
  if (!input || input.stop_hook_active || !input.transcript_path) {
    return null;
  }
  const turns = withClosingMessage(turnsOf(readTranscript(input.transcript_path)), input.last_assistant_message);
  const flags = checkTurns(turns).at(-1);
  if (flags.length === 0) {
    return null;
  }
  return { decision: 'block', reason: reasonFor(flags, loadTitles()) };
}

function runHook() {
  const raw = readStdin();
  if (!raw) {
    process.exit(0);
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  try {
    const result = hookResult(input);
    if (result) {
      process.stdout.write(JSON.stringify(result));
    }
  } catch {
    // A transcript that cannot be read lets the stop through.
  }
  process.exit(0);
}

// --- Replay mode -------------------------------------------------------------------------------

function contextOf(text, offset, id) {
  const start = Math.max(0, offset - CONTEXT_BEFORE);
  const end = Math.min(text.length, offset + id.length + CONTEXT_AFTER);
  function flatten(part) {
    return part.replace(/\r?\n/g, '\\n');
  }
  return (
    (start > 0 ? '…' : '') +
    flatten(text.slice(start, offset)) +
    `[[${id}]]` +
    flatten(text.slice(offset + id.length, end)) +
    (end < text.length ? '…' : '')
  );
}

function replayReport(records, name) {
  const titles = loadTitles();
  const turns = turnsOf(records);
  const flagsPerTurn = checkTurns(turns);
  // The first element only counts as a turn when there was text before the first prompt.
  const turnCount = turns[0].length > 0 ? turns.length : turns.length - 1;
  const turnsWithText = turns.filter((turn) => turn.length > 0).length;
  const blocked = flagsPerTurn.filter((flags) => flags.length > 0).length;
  const flags = flagsPerTurn.flat();

  const lines = [
    `Transcript: ${name} (${records.length} entries)`,
    `Turns: ${turnCount} (with assistant text: ${turnsWithText}), blocked: ${blocked}`,
    `Flagged mentions: ${flags.length}${flags.length > MAX_ROWS ? `, first ${MAX_ROWS} shown` : ''}`,
  ];
  for (const flag of flags.slice(0, MAX_ROWS)) {
    lines.push(
      `line ${flag.lineNumber} ${flag.kind} ${flag.id} (${titleOf(titles, flag.id)})`,
      `    ${contextOf(flag.text, flag.offset, flag.id)}`
    );
  }
  return `${lines.join('\n')}\n`;
}

// --- Entry -------------------------------------------------------------------------------------

function main() {
  const replayIndex = process.argv.indexOf('--replay');
  if (replayIndex === -1) {
    runHook();
    return;
  }
  const file = process.argv[replayIndex + 1];
  if (!file) {
    process.stderr.write('Usage: guard-id-with-title.cjs --replay <transcript.jsonl>\n');
    process.exit(1);
  }
  let records;
  try {
    records = readTranscript(file);
  } catch (error) {
    process.stderr.write(`guard-id-with-title: cannot read ${file} (${error.code || error.message})\n`);
    process.exit(1);
  }
  process.stdout.write(replayReport(records, path.basename(file)));
}

module.exports = { checkTurns };

if (require.main === module) {
  main();
}
