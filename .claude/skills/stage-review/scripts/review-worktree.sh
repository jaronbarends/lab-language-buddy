#!/usr/bin/env bash
# Sets up and tears down the cold review worktree of the stage-review skill.
#
#   review-worktree.sh setup <name> [ref] [base]
#   review-worktree.sh teardown <name> [--force]
#
#   name   short label of the review, e.g. stage-3; used in folder and branch names
#   ref    the commit or branch to review (default HEAD)
#   base   where the stage started (default: merge-base of ref and BASE_REF)
#
# Project settings come from <repo>/.claude/stage-review/project.conf.
# Output is KEY=value lines for Claude to read; warnings go to stderr.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(git rev-parse --show-toplevel)"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

# Windows paths with forward slashes (C:/...) where cygpath exists, so they can be pasted
# into prompts; the plain path elsewhere.
mixed_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -m "$1"
    return
  fi
  echo "$1"
}

native_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$1"
    return
  fi
  echo "$1"
}

load_conf() {
  local conf="$REPO_ROOT/.claude/stage-review/project.conf"
  if [ ! -f "$conf" ]; then
    die "missing $conf"
  fi
  # tr drops CRs, in case the file was checked out with CRLF endings.
  # shellcheck disable=SC1090
  source <(tr -d '\r' <"$conf")
  : "${STRIP:?project.conf: STRIP is not set}"
  : "${DIFF_PATHS:?project.conf: DIFF_PATHS is not set}"
  : "${BASE_REF:?project.conf: BASE_REF is not set}"
  : "${RESULTS_ROOT:?project.conf: RESULTS_ROOT is not set}"
  : "${VERIFY:?project.conf: VERIFY is not set}"
  : "${REPORT_LANGUAGE:?project.conf: REPORT_LANGUAGE is not set}"
  LINK_NODE_MODULES="${LINK_NODE_MODULES:-no}"
}

# Sets WT, BRANCH, RES (and RESULTS_ABS) for a review name.
set_paths() {
  local name="$1"
  if [[ ! "$name" =~ ^[A-Za-z0-9._-]+$ ]]; then
    die "name must be letters, digits, dot, dash or underscore: '$name'"
  fi
  local parent
  parent="$(cd "$REPO_ROOT/.." && pwd)"
  WT="$parent/review-$name"
  BRANCH="review/$name-cold"
  mkdir -p "$REPO_ROOT/$RESULTS_ROOT"
  RESULTS_ABS="$(cd "$REPO_ROOT/$RESULTS_ROOT" && pwd)"
  RES="$RESULTS_ABS/.review-$name"
}

link_node_modules() {
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -NonInteractive -Command \
      "New-Item -ItemType Junction -Path '$(native_path "$WT/node_modules")' -Target '$(native_path "$REPO_ROOT/node_modules")' | Out-Null"
    return
  fi
  ln -s "$REPO_ROOT/node_modules" "$WT/node_modules"
}

# Removes only the link. A non-recursive delete fails on a real, non-empty directory, so
# this can never remove the repo's own node_modules.
unlink_node_modules() {
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -NonInteractive -Command \
      "[System.IO.Directory]::Delete('$(native_path "$WT/node_modules")')"
    return
  fi
  rm "$WT/node_modules"
}

# Escapes a value for use in the replacement part of a sed s||| command.
esc() {
  printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g'
}

render_prompt() {
  local stripped_list="$1" diff_cmd="$2" tip="$3" base="$4" name="$5"
  sed \
    -e "s|{{NAME}}|$(esc "$name")|g" \
    -e "s|{{WORKTREE}}|$(esc "$(mixed_path "$WT")")|g" \
    -e "s|{{BRANCH}}|$(esc "$BRANCH")|g" \
    -e "s|{{REPO_ROOT}}|$(esc "$(mixed_path "$REPO_ROOT")")|g" \
    -e "s|{{REVIEWS_ROOT}}|$(esc "$(mixed_path "$RESULTS_ABS")")|g" \
    -e "s|{{RESULTS_DIR}}|$(esc "$(mixed_path "$RES")")|g" \
    -e "s|{{BASE}}|$(esc "$base")|g" \
    -e "s|{{TIP}}|$(esc "$tip")|g" \
    -e "s|{{DIFF_CMD}}|$(esc "$diff_cmd")|g" \
    -e "s|{{VERIFY}}|$(esc "$VERIFY")|g" \
    -e "s|{{STRIPPED}}|$(esc "$stripped_list")|g" \
    -e "s|{{REPORT_LANGUAGE}}|$(esc "$REPORT_LANGUAGE")|g" \
    "$SKILL_DIR/reviewer-prompt.md" >"$RES/review-prompt.md"
}

setup() {
  local name="${1:-}" ref="${2:-HEAD}" base_arg="${3:-}"
  if [ -z "$name" ]; then
    die "usage: review-worktree.sh setup <name> [ref] [base]"
  fi
  load_conf
  set_paths "$name"

  if [ -e "$WT" ]; then
    die "$WT already exists"
  fi
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    die "branch $BRANCH already exists"
  fi
  if [ -e "$RES" ]; then
    die "$RES already exists"
  fi

  local tip base
  tip="$(git rev-parse --verify "$ref^{commit}")" || die "cannot resolve ref '$ref'"
  if [ -n "$base_arg" ]; then
    base="$(git rev-parse --verify "$base_arg^{commit}")" || die "cannot resolve base '$base_arg'"
  else
    base="$(git merge-base "$BASE_REF" "$tip")" || die "no merge-base of $BASE_REF and $ref"
  fi
  if [ "$base" = "$tip" ]; then
    die "base equals tip, so there is nothing to review (is the stage already merged into $BASE_REF?). Pass an explicit base: setup $name $ref <base>"
  fi

  if [ -n "$(git status --porcelain)" ]; then
    echo "WARNING: the working tree has uncommitted changes; the review sees only what is committed in $ref." >&2
  fi

  git worktree add -b "$BRANCH" "$WT" "$tip" >&2

  local stripped="" item
  for item in $STRIP; do
    if [ -n "$(git -C "$WT" ls-files -- "$item")" ]; then
      git -C "$WT" rm -rq -- "$item"
      stripped="$stripped $item"
    fi
  done
  if [ -n "$stripped" ]; then
    git -C "$WT" commit -q -m "Strip context files for the cold review of $name"
  fi
  local stripped_list="(nothing was removed)"
  if [ -n "$stripped" ]; then
    stripped_list="$(echo "$stripped" | xargs | sed 's/ /, /g')"
  fi

  local linked="no"
  if [ "$LINK_NODE_MODULES" = "yes" ] && [ -d "$REPO_ROOT/node_modules" ]; then
    link_node_modules
    linked="yes"
  fi

  mkdir -p "$RES"
  cp "$REPO_ROOT/.claude/stage-review/criteria.md" "$RES/criteria.md"

  local diff_cmd="git diff $base $tip -- $DIFF_PATHS"
  render_prompt "$stripped_list" "$diff_cmd" "$tip" "$base" "$name"

  cat <<EOF
NAME=$name
WORKTREE=$(mixed_path "$WT")
BRANCH=$BRANCH
TIP=$tip
BASE=$base
RESULTS_DIR=$(mixed_path "$RES")
PROMPT_FILE=$(mixed_path "$RES")/review-prompt.md
DIFF_CMD=$diff_cmd
DIFF_SHORTSTAT=$(git diff --shortstat "$base" "$tip" -- $DIFF_PATHS)
STRIPPED=$stripped_list
NODE_MODULES_LINKED=$linked
EOF
}

teardown() {
  local name="${1:-}" force="no"
  if [ -z "$name" ]; then
    die "usage: review-worktree.sh teardown <name> [--force]"
  fi
  if [ "${2:-}" = "--force" ]; then
    force="yes"
  fi
  load_conf
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

  if [ -e "$WT/node_modules" ]; then
    unlink_node_modules
  fi

  if [ "$force" = "yes" ]; then
    git worktree remove --force "$WT"
  else
    git worktree remove "$WT"
  fi
  git worktree prune

  if [ -d "$REPO_ROOT/node_modules" ]; then
    echo "REPO_NODE_MODULES=intact"
  else
    echo "REPO_NODE_MODULES=missing" >&2
  fi
  echo "REMOVED=$(mixed_path "$WT")"
  echo "BRANCH_KEPT=$BRANCH (delete with: git branch -D $BRANCH)"
  echo "RESULTS_KEPT=$(mixed_path "$RES")"
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
    die "usage: review-worktree.sh setup <name> [ref] [base] | teardown <name> [--force]"
    ;;
esac
