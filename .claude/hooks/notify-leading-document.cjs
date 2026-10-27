#!/usr/bin/env node
'use strict';

// PostToolUse hook for REQ-GG-04 ("Implementeer de communicatieplicht bij
// documentwijzigingen"): after an Edit or Write on a leading document, remind the agent
// of the duty to communicate. It never blocks; the change has already happened and the
// check by Jaron comes before the commit.
//
// Which files count, and the wording of the reminder, live in leading-documents.json next
// to this script. A change of procedure is a change of that file, not of this code.
// Subagents get their own wording: they cannot ask Jaron, so they report it instead.

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'leading-documents.json');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function toRepoPath(filePath, cwd) {
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
  const rel = path.relative(cwd, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return null;
  }
  return rel.split(path.sep).join('/');
}

function isLeadingDocument(repoPath, config) {
  const lower = repoPath.toLowerCase();
  const fileName = lower.split('/').pop();
  const nameMatches = config.fileNames.some((name) => name.toLowerCase() === fileName);
  const pathMatches = config.paths.some((p) => p.toLowerCase() === lower);
  return nameMatches || pathMatches;
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

  const filePath = input.tool_input && input.tool_input.file_path;
  if (!filePath) {
    process.exit(0);
  }

  const config = loadConfig();
  if (!config) {
    process.exit(0);
  }

  const repoPath = toRepoPath(filePath, input.cwd || process.cwd());
  if (!repoPath || !isLeadingDocument(repoPath, config)) {
    process.exit(0);
  }

  const template = input.agent_type ? config.subagentMessage : config.leadMessage;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: template.replace('{path}', repoPath),
      },
    })
  );
  process.exit(0);
}

main();
