#!/usr/bin/env node
'use strict';

// PreToolUse guard for REQ-AH-15 ("Richt de staffel in"): the lead thread may not
// start a `builder` subagent without a `regime: trivial|normal|risky` verdict at
// the top of the assignment. Builder-starts issued by another agent (orchestration)
// pass through unchecked — the triage skill is explicit that the guard cannot see
// those, and the orchestrating agent is the assurance there instead.

const fs = require('fs');

const REGIME_LINE = /^\s*regime:\s*(trivial|normal|risky)\b/im;
const CHECKED_LINES = 3;

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

  if (input.tool_name !== 'Agent') {
    process.exit(0);
  }

  // A builder started by another agent (orchestration) is out of this guard's
  // reach by design; see the triage skill's own "limit of the guard" section.
  if (input.agent_type) {
    process.exit(0);
  }

  const subagentType = input.tool_input && input.tool_input.subagent_type;
  if (subagentType !== 'builder') {
    process.exit(0);
  }

  const prompt = (input.tool_input && input.tool_input.prompt) || '';
  const head = prompt.split('\n').slice(0, CHECKED_LINES).join('\n');

  if (!REGIME_LINE.test(head)) {
    deny(
      'Starting the builder needs a triage verdict first. Load the triage skill, classify ' +
        'the task (trivial / normal / risky, by type — not size), and put ' +
        '"regime: <trivial|normal|risky> — <reason>" on the first line of the prompt.'
    );
  }

  process.exit(0);
}

main();
