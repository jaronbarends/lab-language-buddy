#!/usr/bin/env node
'use strict';

// PreToolUse guard for REQ-AH-13 (lighter version): before the lead thread pushes, sweep
// src/ for files that cross the doorbell/hard-limit without a register decision. If any are
// newly flagged (not already pending), deny the push and name them — the lead thread then
// spawns the refactor-werkplaats agent itself, in-session, before retrying. This stays inside
// an active, human-supervised session; it never spawns anything unattended (that version was
// refused by the harness's own safety classifier — see docs/code-architectuur.md's REQ-AH-13
// note). Subagent pushes are already blocked outright by guard-no-subagent-commit.cjs.

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function loadPending(pendingPath) {
  if (!fs.existsSync(pendingPath)) {
    return {};
  }
  const raw = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
  const now = Date.now();
  const fresh = {};
  for (const [filePath, startedAt] of Object.entries(raw)) {
    if (now - Date.parse(startedAt) < PENDING_TTL_MS) {
      fresh[filePath] = startedAt;
    }
  }
  return fresh;
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

async function main() {
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

  if (input.tool_name !== 'Bash' || input.agent_type) {
    process.exit(0);
  }

  const command = (input.tool_input && input.tool_input.command) || '';
  if (!/\bgit\s+push\b/i.test(command)) {
    process.exit(0);
  }

  const cwd = input.cwd || process.cwd();
  const sweepModuleUrl = pathToFileURL(path.join(cwd, 'scripts', 'sweep-code-architectuur.mjs'));
  const sweepModule = await import(sweepModuleUrl.href);
  const flagged = sweepModule.sweep();

  const pendingPath = path.join(cwd, 'docs', '.refactor-pending.json');
  const pending = loadPending(pendingPath);
  const newWork = flagged.filter((file) => !pending[file.path]);

  if (newWork.length === 0) {
    process.exit(0);
  }

  for (const file of newWork) {
    pending[file.path] = new Date().toISOString();
  }
  fs.writeFileSync(pendingPath, `${JSON.stringify(pending, null, 2)}\n`);

  const list = newWork
    .map((file) => `${file.path} (${file.lines} lines, ${file.status}: ${file.reason})`)
    .join('; ');
  deny(
    `${newWork.length} file(s) need a refactor-werkplaats pass before pushing: ${list}. ` +
      'Spawn the refactor-werkplaats agent for them now, then retry the push.'
  );
}

main();
