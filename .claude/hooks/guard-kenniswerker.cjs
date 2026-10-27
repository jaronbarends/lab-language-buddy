#!/usr/bin/env node
'use strict';

// PreToolUse guard for REQ-AH-08 ("subagent-tenzij"): the main/lead thread may
// not write to source code directly. Subagent calls pass through unchanged.
// A time-boxed override lets Jaron explicitly allow a main-thread edit.

const fs = require('fs');
const path = require('path');

const GUARDED_TOP_LEVEL_DIRS = ['src', 'spikes'];
const DEFAULT_OVERRIDE_MINUTES = 15;
const OVERRIDE_FILE = '.claude/.hoofdthread-override.json';

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function isGuardedPath(filePath, cwd) {
  if (!filePath) {
    return false;
  }
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
  const rel = path.relative(cwd, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return false;
  }
  // A Markdown file is documentation, not code (the CLAUDE.md files under src/ are leading
  // documents the lead thread maintains itself, DFT-002), so it is not guarded.
  if (path.extname(rel).toLowerCase() === '.md') {
    return false;
  }
  const topLevel = rel.split(path.sep)[0].toLowerCase();
  return GUARDED_TOP_LEVEL_DIRS.includes(topLevel);
}

function overrideIsActive(cwd) {
  const overridePath = path.join(cwd, ...OVERRIDE_FILE.split('/'));
  let raw;
  try {
    raw = fs.readFileSync(overridePath, 'utf8');
  } catch {
    return false;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return false;
  }

  const activatedAt = Date.parse(data.activatedAt);
  const durationMinutes = Number(data.durationMinutes) || DEFAULT_OVERRIDE_MINUTES;
  if (!Number.isFinite(activatedAt)) {
    return false;
  }

  const expiresAt = activatedAt + durationMinutes * 60 * 1000;
  return Date.now() <= expiresAt;
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    })
  );
}

function main() {
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

  if (input.tool_name !== 'Edit' && input.tool_name !== 'Write') {
    process.exit(0);
  }

  // Subagent calls (builder, reviewer, ...) pass through.
  if (input.agent_type) {
    process.exit(0);
  }

  const filePath = input.tool_input && input.tool_input.file_path;
  const cwd = input.cwd || process.cwd();

  if (!isGuardedPath(filePath, cwd)) {
    process.exit(0);
  }

  if (overrideIsActive(cwd)) {
    process.exit(0);
  }

  deny(
    'The lead thread does not write to src/ or spikes/ directly (CLAUDE.md, "subagent-tenzij"). ' +
      'Delegate this change to a builder subagent, or, if Jaron has explicitly asked the lead ' +
      'thread to make this edit itself, create ' +
      OVERRIDE_FILE +
      ' with {"activatedAt": "<ISO timestamp>", "durationMinutes": 15} and retry.'
  );
  process.exit(0);
}

main();
