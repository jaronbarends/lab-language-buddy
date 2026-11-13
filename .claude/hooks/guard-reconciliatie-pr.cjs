#!/usr/bin/env node
'use strict';

// PreToolUse guard for HDR-026, made mechanical: before the lead thread opens a pull request with
// `gh pr create`, check whether the branch touches a werkgebied of a leading document and carries
// no new DFT. If so, deny and say what to do: run `npm run docs:drift`, reconcile and book a DFT
// in the same pull request. The rule lives in docs/grootboek/CLAUDE.md, which does not load when
// someone only works in src/ (JNL-002, K7); this delivers it at the moment it matters.
//
// The werkgebieden come from scripts/drift-signal.mjs, the source docs:check reads too, so there
// is one list. Same shape as guard-merge-renumber.cjs: it denies and names, the lead thread does
// the work and retries. Lead thread only; a `gh pr create` in a plain terminal is not seen (the
// drift warning of docs:check is the net there). Anything unexpected lets the command through.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const BASE_REFS = ['origin/main', 'main'];
const DFT_FOLDER = 'docs/grootboek/dft/';

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

// True when any command in a chain (`git push && gh pr create`) is `gh pr create`.
function createsPullRequest(command) {
  return command.split(/&&|\|\||[;|\n]/).some((segment) => /(^|\s)gh\s+pr\s+create(\s|$)/.test(segment));
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// What the branch changed against the base, as { status, file } with the new path of a rename.
function branchChanges(cwd) {
  for (const base of BASE_REFS) {
    try {
      return git(cwd, ['diff', '--name-status', `${base}...HEAD`])
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [status, ...paths] = line.split('\t');
          return { status: status[0], file: paths.at(-1) };
        });
    } catch {
      // try the next base
    }
  }
  return null;
}

// The changed files inside a werkgebied. A leading document is never drift, so its own path is
// left out, as docs:drift does.
function filesInWerkgebied(changes, leading) {
  const leadingPaths = new Set(leading.map((document) => document.path));
  const scopes = leading.flatMap((document) => document.scope);
  return changes
    .map((change) => change.file)
    .filter((file) => !leadingPaths.has(file))
    .filter((file) => scopes.some((scope) => file === scope || file.startsWith(`${scope}/`)));
}

function addsDft(changes) {
  return changes.some(
    (change) => change.status === 'A' && change.file.startsWith(DFT_FOLDER) && change.file.endsWith('.md')
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
  if (!createsPullRequest(command)) {
    process.exit(0);
  }

  try {
    const cwd = input.cwd || process.cwd();
    const changes = branchChanges(cwd);
    if (!changes || addsDft(changes)) {
      process.exit(0);
    }

    const driftModule = await import(pathToFileURL(path.join(__dirname, '..', '..', 'scripts', 'drift-signal.mjs')).href);
    const touched = filesInWerkgebied(changes, driftModule.listLeadingDocuments(cwd));
    if (touched.length === 0) {
      process.exit(0);
    }

    deny(
      `Pull request tegengehouden (HDR-026): deze branch raakt een werkgebied (${touched.join(', ')}) ` +
        'en bevat geen nieuwe DFT. Draai `npm run docs:drift`, reconcilieer de genoemde documenten ' +
        'tegen de code en boek de uitkomst als DFT met `documenten` en `getoetst-tegen` en status ' +
        '`resolved`, in dezelfde pull request (register en docs/index.yml mee). Probeer het daarna ' +
        'opnieuw. Raakte alleen commentaar het werkgebied, dan geldt hetzelfde: de DFT is "geen verschil".'
    );
  } catch {
    process.exit(0);
  }
  process.exit(0);
}

main();
