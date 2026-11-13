// Tests for .claude/hooks/guard-reconciliatie-pr.cjs (HDR-026, JNL-002 K7): the hook is fed
// simulated PreToolUse input and runs against a throwaway git repo, never a real pull request.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const HOOK = join(dirname(fileURLToPath(import.meta.url)), "..", ".claude", "hooks", "guard-reconciliatie-pr.cjs");

let repo;

function git(...args) {
  return execFileSync("git", ["-c", "core.autocrlf=false", "-c", "user.name=test", "-c", "user.email=test@example.com", ...args], {
    cwd: repo,
    encoding: "utf8",
  });
}

function write(path, content) {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), content);
}

// Starts a branch off the base commit, applies the changes and commits them.
function branchWith(name, files) {
  git("checkout", "-q", "-b", name, "origin/main");
  for (const [path, content] of Object.entries(files)) {
    write(path, content);
  }
  git("add", "-A");
  git("commit", "-q", "-m", name);
}

function runHook(command, extra = {}) {
  const result = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ tool_name: "Bash", tool_input: { command }, cwd: repo, ...extra }),
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  return result.stdout ? JSON.parse(result.stdout).hookSpecificOutput : null;
}

describe("guard-reconciliatie-pr", () => {
  before(() => {
    repo = mkdtempSync(join(tmpdir(), "guard-reconciliatie-"));
    git("init", "-q", "-b", "main");
    write("src/lib/CLAUDE.md", "# lib\n");
    write("src/lib/a.ts", "export const a = 1;\n");
    write("README.md", "# readme\n");
    write("docs/grootboek/dft/.gitkeep", "");
    git("add", "-A");
    git("commit", "-q", "-m", "base");
    git("update-ref", "refs/remotes/origin/main", "HEAD");
  });

  after(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it("denies a branch that touches a werkgebied and adds no DFT", () => {
    branchWith("code-only", { "src/lib/a.ts": "export const a = 2;\n" });
    const output = runHook("gh pr create --title x");
    assert.equal(output.permissionDecision, "deny");
    assert.match(output.permissionDecisionReason, /HDR-026/);
    assert.match(output.permissionDecisionReason, /src\/lib\/a\.ts/);
    assert.match(output.permissionDecisionReason, /npm run docs:drift/);
  });

  it("also denies when gh pr create follows a push in one command", () => {
    const output = runHook("git push -u origin code-only && gh pr create --fill");
    assert.equal(output.permissionDecision, "deny");
  });

  it("lets a branch through that touches a werkgebied and adds a DFT", () => {
    git("checkout", "-q", "main");
    branchWith("code-and-dft", {
      "src/lib/a.ts": "export const a = 3;\n",
      "docs/grootboek/dft/dft-001-x.md": "# DFT-001\n",
    });
    assert.equal(runHook("gh pr create --fill"), null);
  });

  it("lets a branch through that touches no werkgebied", () => {
    git("checkout", "-q", "main");
    branchWith("docs-only", { "README.md": "# changed\n" });
    assert.equal(runHook("gh pr create --fill"), null);
  });

  it("lets a branch through that only changes a leading document", () => {
    git("checkout", "-q", "main");
    branchWith("leading-only", { "src/lib/CLAUDE.md": "# changed\n" });
    assert.equal(runHook("gh pr create --fill"), null);
  });

  it("ignores commands that are not gh pr create, and subagents", () => {
    git("checkout", "-q", "code-only");
    assert.equal(runHook("gh pr view"), null);
    assert.equal(runHook("git push"), null);
    assert.equal(runHook("gh pr create --fill", { agent_type: "builder" }), null);
  });
});
