#!/usr/bin/env node
'use strict';

// PreToolUse guard for REQ-AH-05: subagents (builder, reviewer, ...) may never
// run `git commit` / `git push`. Only the lead thread commits, and only on
// Jaron's go-ahead (builder.md already says so in prose; this makes it
// deterministic regardless of whether an agent reads or follows that line).

const fs = require('fs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
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

  if (input.tool_name !== 'Bash') {
    process.exit(0);
  }

  // Absent agent_type means this call came from the main/lead thread, where
  // commits happen on Jaron's explicit go-ahead in the conversation.
  if (!input.agent_type) {
    process.exit(0);
  }

  const command = (input.tool_input && input.tool_input.command) || '';
  const commitOrPush = /\bgit\s+(commit|push)\b/i;

  if (commitOrPush.test(command)) {
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `Subagents (agent_type: "${input.agent_type}") may not commit or push. ` +
          "Report what changed back to the lead thread; only the lead commits, and only on Jaron's go-ahead.",
      },
    };
    process.stdout.write(JSON.stringify(output));
  }

  process.exit(0);
}

main();
