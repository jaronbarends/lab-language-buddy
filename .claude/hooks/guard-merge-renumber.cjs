#!/usr/bin/env node
'use strict';

// PreToolUse guard for HDR-005, made mechanical: before the lead thread merges arc/arc-main or
// main into a branch, check whether the grootboek records this branch added collide with ids
// that ref already holds. If they do, deny the merge, name the collisions and say to run
// `npm run docs:renumber` first. Renumbering has to happen BEFORE the merge: after it, every
// mention of a colliding id is ambiguous (see scripts/renumber-records.mjs).
//
// Same shape as guard-push-sweep.cjs: it denies and names, the lead thread does the work and
// retries. Lead thread only; a merge in a plain terminal is not seen (the duplicate-id check in
// docs:check is the net there). Anything unexpected lets the merge through.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GUARDED_REFS = ['arc/arc-main', 'origin/arc/arc-main', 'main', 'origin/main'];
const OPTIONS_WITH_VALUE = ['-m', '-s', '-X', '-F', '--message', '--strategy', '--strategy-option', '--file'];
const MERGE_ENDINGS = ['--abort', '--continue', '--quit'];
const SCRIPT = path.join('scripts', 'renumber-records.mjs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
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

// The refs a command merges, for every `git ... merge <ref>` in a chain of commands.
function mergedRefs(command) {
  const refs = [];
  for (const segment of command.split(/&&|\|\||[;|\n]/)) {
    const tokens = segment.trim().split(/\s+/);
    const gitIndex = tokens.indexOf('git');
    const mergeIndex = gitIndex < 0 ? -1 : tokens.indexOf('merge', gitIndex + 1);
    if (mergeIndex < 0) {
      continue;
    }
    const args = tokens.slice(mergeIndex + 1);
    if (args.some((arg) => MERGE_ENDINGS.includes(arg))) {
      continue;
    }
    for (let index = 0; index < args.length; index += 1) {
      if (OPTIONS_WITH_VALUE.includes(args[index])) {
        index += 1;
      } else if (!args[index].startsWith('-')) {
        refs.push(args[index]);
      }
    }
  }
  return refs.filter((ref) => GUARDED_REFS.includes(ref));
}

function checkAgainst(ref, cwd) {
  const output = execFileSync(
    process.execPath,
    [path.join(cwd, SCRIPT), '--check', '--base', ref, '--no-fetch'],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
  return JSON.parse(output);
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

  if (input.tool_name !== 'Bash' || input.agent_type) {
    process.exit(0);
  }

  const command = input.tool_input && input.tool_input.command;
  if (!command) {
    process.exit(0);
  }

  const refs = mergedRefs(command);
  const cwd = input.cwd || process.cwd();
  if (refs.length === 0 || !fs.existsSync(path.join(cwd, SCRIPT))) {
    process.exit(0);
  }

  try {
    for (const ref of refs) {
      const result = checkAgainst(ref, cwd);
      if (result.refusal && result.kind === 'no-base') {
        continue;
      }
      if (result.refusal) {
        deny(`Merge of ${ref} held back (HDR-005): ${result.refusal}`);
        process.exit(0);
      }
      if (result.collisions.length > 0) {
        const list = result.collisions
          .map((c) => `${c.oldId} -> ${c.newId} (${c.newBestand})`)
          .join('; ');
        deny(
          `Merging ${ref} would give two records the same id (HDR-005): ${list}. ` +
            `First run \`npm run docs:renumber -- --base ${ref} --no-fetch\`, review the result and ` +
            'commit it, then retry the merge. After the merge, the references to a colliding id ' +
            'can no longer be told apart.'
        );
        process.exit(0);
      }
    }
  } catch {
    process.exit(0);
  }
  process.exit(0);
}

main();
