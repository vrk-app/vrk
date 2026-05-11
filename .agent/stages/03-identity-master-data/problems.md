# Problems

Current fresh-verifier verdict for `slice-011-input-help-tooltip`: `PASS`.

## Failed Criteria

None.

## Proof Gaps

None.

## Exact Reproduction

All commands were run from `/Users/yura-posledov/cursor/vrk`.

```bash
python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 03-identity-master-data
python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query "InputField hint helper help tooltip"
curl -fsSL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md -o .agent/stages/03-identity-master-data/raw/slice-011-input-help-tooltip-fresh-verifier-2-web-interface-guidelines-source-2026-04-30.md
env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PNPM_CONFIG_ENGINE_STRICT=false pnpm --dir apps/web run lint
env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PNPM_CONFIG_ENGINE_STRICT=false pnpm --dir apps/web run typecheck
env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PNPM_CONFIG_ENGINE_STRICT=false pnpm --dir apps/web run build
env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PNPM_CONFIG_ENGINE_STRICT=false pnpm --dir apps/web run build-storybook
env PATH=/Users/yura-posledov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PNPM_CONFIG_ENGINE_STRICT=false pnpm --dir apps/web exec node ../../.agent/stages/03-identity-master-data/raw/slice-011-input-help-tooltip-fresh-verifier-2-dom-proof-script-2026-04-30.cjs
git diff --check
jq empty .agent/stages/03-identity-master-data/evidence.json .agent/stages/03-identity-master-data/feature_list.json .agent/stages/03-identity-master-data/verdict.json
```

## Reproduced Proof

- Harness self-check: PASS.
- Storybook lookup: `Primitives/InputField [InputField]` is the first match; source `apps/web/shared/ui/InputField.tsx`; story `apps/web/stories/primitives/InputField.stories.tsx`; decision `extend` is supported.
- Web checks: lint, typecheck, Next build, and Storybook build all PASS.
- Web Interface Guidelines: fetched current Vercel source and reviewed the active slice UI files. `apps/web/shared/ui/InputField.tsx` PASS. `apps/web/stories/primitives/InputField.stories.tsx` PASS, including fixed `WithHintAndError` args `autoComplete: "off"` and `placeholder: "770501001…"`.
- Focused DOM proof: Storybook static server ran on an ephemeral port and exited. `WithHint` has `persistentHintRows=0`, no input `aria-describedby`, help-trigger description present, and tooltip visible on hover/focus. `WithHintAndError` has `persistentHintRows=0`, visible error below input, input `aria-describedby` resolves to the error text, help-trigger description `9 цифр.`, and tooltip visible on hover/focus.
- Source/doc proof: `InputField` renders only `error` below the input; `/company` КПП still passes `hint="9 цифр."` and `error={profileErrors.kpp}`; `docs/design/storybook-component-backlog.md` records the updated `hint` contract and `WithHintAndError` story.
- `git diff --check`: PASS.
- JSON audit: PASS.

## Runtime Note

`http://localhost:3100/company` returned HTTP 200, but the fetched HTML is the unauthenticated "Требуется вход" shell and does not render profile fields. This verifier did not start a long-running dev or preview server. The slice behavior is therefore claimed through source proof, fresh local production build, fresh Storybook build, and focused Storybook DOM proof.

## Smallest Safe Fix Direction

No fix required for this slice.
