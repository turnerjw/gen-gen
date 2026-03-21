#!/usr/bin/env bash
#
# orchestrate-audit.sh — runs all gen-gen audit tasks in parallel cmux workspaces
#
# Run this script from within a cmux terminal. It will:
#   1. Open a workspace per task in Batch A (all parallel)
#   2. Wait for all Batch A tasks to finish
#   3. Open Batch B workspaces
#   4. Wait, then open Batch C
#
# Each workspace runs claude autonomously. Progress is shown in this workspace's sidebar.
#
# Usage:
#   bash scripts/orchestrate-audit.sh
#
# Requirements:
#   - Run from within cmux (CMUX_WORKSPACE_ID must be set)
#   - claude must be in PATH
#   - gh must be in PATH and authenticated

set -euo pipefail

CMUX=/Applications/cmux.app/Contents/Resources/bin/cmux
REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PLAN="$REPO/AUDIT_PLAN.md"
RUN_DIR=$(mktemp -d /tmp/gen-gen-audit-XXXXXX)

log() { echo "[orchestrator] $*"; }
fail() { echo "[orchestrator] ERROR: $*" >&2; exit 1; }

[ -f "$PLAN" ] || fail "AUDIT_PLAN.md not found at $REPO"
[ -n "${CMUX_WORKSPACE_ID:-}" ] || fail "Not running inside cmux (CMUX_WORKSPACE_ID is not set)"
command -v claude >/dev/null || fail "claude not found in PATH"
command -v gh >/dev/null || fail "gh not found in PATH"

# ─── helpers ─────────────────────────────────────────────────────────────────

# Write a task runner script + prompt file, then open it in a new named workspace
launch_task() {
  local id=$1   # e.g. T1, T2T3
  local title=$2
  local prompt=$3

  local prompt_file="$RUN_DIR/prompt_${id}.txt"
  local runner="$RUN_DIR/run_${id}.sh"
  local done_file="$RUN_DIR/${id}.done"
  local fail_file="$RUN_DIR/${id}.fail"

  printf '%s' "$prompt" > "$prompt_file"

  cat > "$runner" << RUNNER
#!/usr/bin/env bash
set -euo pipefail
cd "$REPO"
echo "=== Task $id: $title ==="
echo "Plan: $PLAN"
echo ""
claude -p "\$(cat "$prompt_file")"
exit_code=\$?
if [ "\$exit_code" -eq 0 ]; then
  touch "$done_file"
  $CMUX notify --title "✓ $id done" --body "$title" 2>/dev/null || true
  $CMUX log --source "audit" -- "Task $id succeeded" 2>/dev/null || true
else
  touch "$fail_file"
  $CMUX notify --title "✗ $id failed" --body "$title — check the workspace" 2>/dev/null || true
  $CMUX log --level error --source "audit" -- "Task $id failed (exit \$exit_code)" 2>/dev/null || true
fi
RUNNER
  chmod +x "$runner"

  local ws_ref
  ws_ref=$($CMUX new-workspace --cwd "$REPO" --command "bash $runner")
  $CMUX rename-workspace --workspace "$ws_ref" "$id: $title" 2>/dev/null || true

  log "Launched $id → workspace $ws_ref"
}

# Poll until all listed task IDs have a .done or .fail file
wait_for() {
  local tasks=("$@")
  local pending=true
  while $pending; do
    pending=false
    for id in "${tasks[@]}"; do
      if [[ ! -f "$RUN_DIR/${id}.done" && ! -f "$RUN_DIR/${id}.fail" ]]; then
        pending=true
        break
      fi
    done
    $pending && sleep 15
  done
}

# Count done/fail across a list of task IDs
count_results() {
  local tasks=("$@")
  local done=0 failed=0
  for id in "${tasks[@]}"; do
    [[ -f "$RUN_DIR/${id}.done" ]] && ((done++)) || true
    [[ -f "$RUN_DIR/${id}.fail" ]] && ((failed++)) || true
  done
  echo "done=$done failed=$failed"
}

status() {
  $CMUX set-status "audit" "$1" 2>/dev/null || true
  log "$1"
}

progress() {
  $CMUX set-progress "$1" --label "$2" 2>/dev/null || true
}

# ─── task prompts ─────────────────────────────────────────────────────────────
# Each prompt is self-contained: reference the plan, state the task, give steps.

BASE_INSTRUCTIONS="Read the execution plan at $PLAN and implement the task described below.

Use EnterWorktree to create a new isolated worktree from the main branch.
Implement all changes described for this task in the plan.
Run the verification: bun run typecheck && bun test && bun run build && bun run gen:example
Create a changeset file in .changeset/ using the bump type and message from the plan.
Commit all changes with a clear commit message and open a PR to main.
Exit the worktree when done."

PROMPT_T1="$BASE_INSTRUCTIONS

Task: T1 — Remove the readonlyProperties option from the PropertyPolicy interface and all related code."

PROMPT_T2T3="$BASE_INSTRUCTIONS

Task: T2T3 — Remove the markerText option AND move watchDiagnostics behind the GEN_GEN_WATCH_DIAGNOSTICS env var. Both are in the same PR."

PROMPT_T4T5="$BASE_INSTRUCTIONS

Task: T4T5 — Two FakerOverrides fixes in one PR:
(T4) Fix block-body zero-arg arrow functions to get body extraction same as expression-body ones.
(T5) Support bare function references like 'email: faker.internet.email' (auto-call via PropertyAccessExpression detection in extractFunctionOverrideSpec)."

PROMPT_T6="$BASE_INSTRUCTIONS

Task: T6 — Export GenGenConfigOptions interface, and also ensure FakerStrategyContext and FakerStrategyResult are re-exported from src/index.ts."

PROMPT_T7="$BASE_INSTRUCTIONS

Task: T7 — Change the deepMerge default from false to true in both generateDataFile (generator.ts) and parseArgs (cli-core.ts). Update any tests that relied on the old shallow-merge default."

PROMPT_T8="$BASE_INSTRUCTIONS

Task: T8 — Add plural array helper generateXxxItems(count, overrides?) alongside each existing generateXxxItem(overrides?) helper in the GenGenHelpers type and runtime factory."

PROMPT_T9="$BASE_INSTRUCTIONS

Task: T9 — Improve unused FakerOverride key warnings to suggest the nearest valid path (e.g. 'Did you mean User.email?') using fuzzy/substring matching against the set of known matched paths."

PROMPT_T14="$BASE_INSTRUCTIONS

Task: T14 — Generate FakerOverridePaths union type and TypedFakerOverrides mapped type into the generated section of each data-gen file."

PROMPT_T10="$BASE_INSTRUCTIONS

Task: T10 — Add collectGenGenConfig() to parse a 'const GenGenConfig = { ... } as const' declaration from the data-gen file, and merge it into generation options (data-gen file config as base, API options override)."

PROMPT_T11="$BASE_INSTRUCTIONS

Task: T11 — Add collectFakerStrategy() to parse a 'const FakerStrategy = (ctx) => { ... }' declaration from the data-gen file, extract the function via AST, eval it, and use it as the strategy hook."

PROMPT_T12="$BASE_INSTRUCTIONS

Task: T12 — Strip project-specific options from GenerateOptions, GenGenPluginOptions, and CLI. Keep only: input, cwd, write, failOnWarn, watch, check, dryRun. Prerequisite: T10 and T11 must already be merged."

PROMPT_T13="$BASE_INSTRUCTIONS

Task: T13 — Remove typeMappingPresets entirely: the TypeMappingPresetName type, all preset resolution logic, the --preset CLI flag, and all related interfaces. Prerequisite: T11 must already be merged."

# ─── main ─────────────────────────────────────────────────────────────────────

log "Run directory: $RUN_DIR"
log "Repo: $REPO"
echo ""

# ── Batch A ──────────────────────────────────────────────────────────────────
status "Batch A: launching 8 tasks in parallel"
progress 0.05 "Batch A starting..."

launch_task "T1"   "Remove readonlyProperties"         "$PROMPT_T1"
launch_task "T2T3" "markerText + watchDiagnostics"     "$PROMPT_T2T3"
launch_task "T4T5" "FakerOverrides improvements"       "$PROMPT_T4T5"
launch_task "T6"   "Export GenGenConfigOptions"        "$PROMPT_T6"
launch_task "T7"   "deepMerge default true"            "$PROMPT_T7"
launch_task "T8"   "Plural array helpers"              "$PROMPT_T8"
launch_task "T9"   "Warning improvements"              "$PROMPT_T9"
launch_task "T14"  "FakerOverridePaths types"          "$PROMPT_T14"

log "All Batch A tasks launched. Waiting for completion..."
progress 0.1 "Batch A running (8 tasks)..."

BATCH_A=(T1 T2T3 T4T5 T6 T7 T8 T9 T14)
wait_for "${BATCH_A[@]}"

read -r results <<< "$(count_results "${BATCH_A[@]}")"
log "Batch A complete — $results"
$CMUX notify --title "Batch A complete" --body "$results — starting Batch B" 2>/dev/null || true
progress 0.55 "Batch B starting..."

# ── Batch B ──────────────────────────────────────────────────────────────────
status "Batch B: launching T10 + T11"

launch_task "T10" "GenGenConfig parsing"    "$PROMPT_T10"
launch_task "T11" "FakerStrategy parsing"   "$PROMPT_T11"

log "Batch B tasks launched. Waiting..."
progress 0.6 "Batch B running (2 tasks)..."

BATCH_B=(T10 T11)
wait_for "${BATCH_B[@]}"

read -r results <<< "$(count_results "${BATCH_B[@]}")"
log "Batch B complete — $results"
$CMUX notify --title "Batch B complete" --body "$results — starting Batch C" 2>/dev/null || true
progress 0.8 "Batch C starting..."

# ── Batch C ──────────────────────────────────────────────────────────────────
status "Batch C: launching T12 + T13 (requires T10+T11 merged — confirm before continuing)"

echo ""
echo "⚠  Batch C depends on T10 and T11 being MERGED (not just open)."
echo "   Have you merged both Batch B PRs? [y/N]"
read -r confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborting Batch C. Re-run the script from the Batch C section when ready."
  $CMUX clear-progress 2>/dev/null || true
  exit 0
fi

launch_task "T12" "Strip API/CLI options"       "$PROMPT_T12"
launch_task "T13" "Remove typeMappingPresets"   "$PROMPT_T13"

log "Batch C tasks launched. Waiting..."
progress 0.85 "Batch C running (2 tasks)..."

BATCH_C=(T12 T13)
wait_for "${BATCH_C[@]}"

read -r results <<< "$(count_results "${BATCH_C[@]}")"
log "Batch C complete — $results"

progress 1.0 "All done!"
$CMUX notify --title "Audit complete" --body "All tasks finished. Check PRs on GitHub." 2>/dev/null || true
$CMUX clear-progress 2>/dev/null || true

echo ""
echo "=== All tasks complete ==="
echo "Run dir (logs/sentinels): $RUN_DIR"
echo "Check GitHub for open PRs: gh pr list"
