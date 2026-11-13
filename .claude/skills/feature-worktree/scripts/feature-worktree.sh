#!/usr/bin/env bash
# Sets up and tears down a feature worktree next to the main checkout.
#
#   feature-worktree.sh setup <name>
#   feature-worktree.sh teardown <name> [--force]
#
#   name   short label of the feature; used for the folder (<repo>-<name>) and the branch (<name>)
#
# The branch always starts from main, never from the branch the main checkout is on.
# Output is KEY=value lines for Claude to read; progress and warnings go to stderr.
set -euo pipefail

FIRST_PORT=3001
LAST_PORT=3099

die() {
  echo "ERROR: $*" >&2
  exit 1
}

# Windows paths with forward slashes (C:/...) where cygpath exists, so they can be pasted
# into a terminal; the plain path elsewhere.
mixed_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -m "$1"
    return
  fi
  echo "$1"
}

# Sets MAIN_ROOT (the main checkout, also when run from inside a worktree), WT and BRANCH.
set_paths() {
  local name="$1"
  if [[ ! "$name" =~ ^[A-Za-z0-9._-]+$ ]]; then
    die "name must be letters, digits, dot, dash or underscore: '$name'"
  fi
  MAIN_ROOT="$(git worktree list --porcelain | sed -n '1s/^worktree //p')"
  WT="$(cd "$MAIN_ROOT/.." && pwd)/$(basename "$MAIN_ROOT")-$name"
  BRANCH="$name"
}

# Succeeds when something is listening on the port. Without netstat we cannot tell, so the
# port counts as free.
port_is_taken() {
  local port="$1"
  if ! command -v netstat >/dev/null 2>&1; then
    return 1
  fi
  netstat -ano | grep -E "[:.]$port[[:space:]].*LISTENING" >/dev/null
}

find_free_port() {
  local port
  for ((port = FIRST_PORT; port <= LAST_PORT; port++)); do
    if ! port_is_taken "$port"; then
      echo "$port"
      return
    fi
  done
  die "no free port between $FIRST_PORT and $LAST_PORT"
}

setup() {
  local name="${1:-}"
  if [ -z "$name" ]; then
    die "usage: feature-worktree.sh setup <name>"
  fi
  set_paths "$name"

  if [ -e "$WT" ]; then
    die "$WT already exists"
  fi
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    die "branch $BRANCH already exists"
  fi
  git show-ref --verify --quiet refs/heads/main || die "no local branch main to start from"

  git worktree add -b "$BRANCH" "$WT" main >&2

  # Untracked and git-ignored, so a fresh worktree does not have it. .env.prd stays behind on purpose.
  local env_copied="no"
  if [ -f "$MAIN_ROOT/.env.local" ]; then
    cp "$MAIN_ROOT/.env.local" "$WT/.env.local"
    env_copied="yes"
  else
    echo "WARNING: no .env.local in $MAIN_ROOT, nothing copied." >&2
  fi

  echo "Running npm install in the worktree..." >&2
  (cd "$WT" && npm install >&2)

  local port
  port="$(find_free_port)"

  cat <<EOF
NAME=$name
WORKTREE=$(mixed_path "$WT")
BRANCH=$BRANCH
STARTED_FROM=main ($(git rev-parse --short main))
ENV_LOCAL_COPIED=$env_copied
DEV_PORT=$port
DEV_COMMAND=cd $(mixed_path "$WT") && npx next dev -p $port
OPEN_COMMAND=code $(mixed_path "$WT")
EOF
}

teardown() {
  local name="${1:-}" force="no" arg
  if [ -z "$name" ]; then
    die "usage: feature-worktree.sh teardown <name> [--force]"
  fi
  shift
  for arg in "$@"; do
    case "$arg" in
      --force) force="yes" ;;
      *) die "unknown option $arg" ;;
    esac
  done
  set_paths "$name"

  if [ ! -d "$WT" ]; then
    die "no worktree at $WT"
  fi

  local dirty
  dirty="$(git -C "$WT" status --porcelain)"
  if [ -n "$dirty" ] && [ "$force" != "yes" ]; then
    echo "$dirty" >&2
    die "the worktree has uncommitted changes (listed above); look at them, then rerun with --force"
  fi

  if [ "$force" = "yes" ]; then
    git worktree remove --force "$WT"
  else
    git worktree remove "$WT"
  fi
  git worktree prune
  echo "REMOVED=$(mixed_path "$WT")"

  # -d (not -D) refuses a branch that is not merged, so unpushed work is never deleted here.
  if git branch -d "$BRANCH" >/dev/null 2>&1; then
    echo "BRANCH_DELETED=$BRANCH"
    return
  fi
  echo "BRANCH_KEPT=$BRANCH (not merged into the current branch; delete with: git branch -D $BRANCH)"
}

case "${1:-}" in
  setup)
    shift
    setup "$@"
    ;;
  teardown)
    shift
    teardown "$@"
    ;;
  *)
    die "usage: feature-worktree.sh setup <name> | teardown <name> [--force]"
    ;;
esac
