# Fresh Verifier: slice-011-equipment-archive-action-parity

- Stage: `03-identity-master-data`
- Slice under verification: `slice-011-equipment-archive-action-parity`
- Checked at: `2026-04-30T13:38:55Z`
- Verdict: `PASS`
- Active sprint contract note: `.agent/stages/03-identity-master-data/sprint_contract.md` is intentionally on `slice-011-input-help-tooltip`; it was not replaced.

## Scope Verified

The requested bounded UI slice is limited to `/equipment` archive trigger buttons in `apps/web/features/Stage03Equipment/ui/EquipmentRegistryWorkspace.tsx`.

Verified in-scope archive triggers:

- equipment cards
- measuring instrument cards
- selected measuring instrument detail action
- standard cards
- selected standard detail action

Each trigger uses:

- `leftIcon={<Archive className="size-4" />}`
- visible label `Архивировать`
- `size="sm"`
- `variant="ghost"`
- `loading={isMutating}`
- entity-specific `aria-label`

## Evidence Metadata Audit

PASS.

- Brief/source for the bounded continuation is present in `progress.md` at `2026-04-30T16:34:00+03:00` and summarized in `evidence.md`.
- Component lookup reference is present:
  `.agent/stages/03-identity-master-data/raw/storybook-lookup-slice-011-equipment-archive-action-parity-2026-04-30.txt`
- Lookup rerun matched:
  `Equipment/EquipmentRegistryWorkspace`, `Primitives/ConfirmDialog`, `Primitives/Dialog`.
- Reuse decision is recorded as `reuse`.
- Changed UI file is recorded:
  `apps/web/features/Stage03Equipment/ui/EquipmentRegistryWorkspace.tsx`.
- Web Interface Guidelines result is recorded as PASS:
  `.agent/stages/03-identity-master-data/raw/slice-011-equipment-archive-action-parity-ui-review-2026-04-30.txt`.
- No net-new reusable UI family was introduced, so no new stories or backlog update are required for this slice.
- Canonical docs did not need an update because the slice is visual parity only and does not change product behavior, API contract, schema, or workflow.

## Source Audit

Reran a targeted Node audit over `EquipmentRegistryWorkspace.tsx`.

Result:

```text
archive request buttons found: 5
PASS equipment-archive-error: line 1869; Archive icon + visible label + size sm + ghost + loading preserved
PASS equipment-mi-archive-error: line 2162; Archive icon + visible label + size sm + ghost + loading preserved
PASS equipment-mi-selected-archive-error: line 2327; Archive icon + visible label + size sm + ghost + loading preserved
PASS equipment-standard-archive-error: line 2627; Archive icon + visible label + size sm + ghost + loading preserved
PASS equipment-standard-selected-archive-error: line 2796; Archive icon + visible label + size sm + ghost + loading preserved
PASS stale selected label absent: Архивировать выбранное СИ
PASS stale selected label absent: Архивировать выбранный эталон
PASS unchanged versus HEAD: buildEquipmentRoute
PASS unchanged versus HEAD: handleArchiveVisibilityChange
PASS unchanged versus HEAD: archiveEquipment
PASS unchanged versus HEAD: archiveMeasuringInstrument
PASS unchanged versus HEAD: archiveStandard
PASS unchanged versus HEAD: requestArchive
PASS unchanged versus HEAD: confirmArchive
```

This reproduces the preservation requirement for archive API calls, loading state, toasts through the unchanged archive functions, `requestArchive`, `confirmArchive`, and archive visibility routing.

## Web Interface Guidelines Review

Fetched fresh guidelines to:

`.agent/stages/03-identity-master-data/raw/web-interface-guidelines-source-2026-04-30-equipment-archive-verifier.md`

Manual review result:

```text
## apps/web/features/Stage03Equipment/ui/EquipmentRegistryWorkspace.tsx

✓ pass
```

Reasoning:

- Archive controls are real `Button` / `<button>` actions.
- The archive icon is decorative through shared `Button` `leftIcon` wrapping with `aria-hidden="true"`.
- Each in-scope archive action has a visible label and an entity-specific `aria-label`.
- Focus, hover, disabled, and loading treatment are inherited from shared `Button`.
- Destructive archive behavior still routes through confirmation before executing.

## Checks Rerun

```text
python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data
PASS

python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "archive action button equipment registry confirm dialog destructive"
PASS

PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PNPM_CONFIG_ENGINE_STRICT=false pnpm --dir apps/web run typecheck
PASS

PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PNPM_CONFIG_ENGINE_STRICT=false pnpm --dir apps/web run lint
PASS

git diff --check
PASS
```

Note: a first local typecheck attempt without the bundled Node path was blocked by the repo engine constraint because the shell default was Node v20. The command above is the valid reproduction command and passed.

## Runtime

Runtime screenshot proof was not rerun or claimed. Existing evidence records that `localhost:3100` responded but served a stale bundle, and AGENTS.md forbids starting an ad-hoc long-running preview server without an explicit request. Source, typecheck, lint, existing build artifacts, and UI review are sufficient for this bounded visual-prop parity check.

## Failed Criteria

None.

## Proof Gaps

None.

## Smallest Safe Fix Direction

No fix required.
