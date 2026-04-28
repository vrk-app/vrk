# Evidence

- Stage ID: `01-ui-storybook-foundation`
- Sprint contract: `slice-002-wave1-shell-auth-request-showcases`

## Prior Proven Slice

- `slice-001-storybook-scaffold-and-foundations` remains proven and stays part of the Stage 01 bundle.

## 2026-04-18 Current-Tree Refresh

- Reopened the Stage 01 proof loop to close current-tree truthfulness and contract drift without leaving stale PASS claims behind.
- Closed the current-tree proof gaps without expanding Stage 01:
  - the shared token bridge now carries the missing semantic aliases used by the design system (`interactive-hover`, `surface-hover`, `text-tertiary`, `text-disabled`, `text-xs`, `text-4xl`, `radius-full`, `shadow-xl`) across `design-tokens.ts` and `globals.css`;
  - `IconGallery` stories now isolate `NavigationIcons`, `ActionIcons`, `FileTypeIcons`, and `StatusIcons`, so each backlog proof state resolves to a distinct section instead of aliasing the same mixed render;
  - `TopBar` now renders notification and user actions as explicitly unavailable when `onNotificationsClick` / `onUserMenu` are not wired.
  - The non-wired search path keeps the existing unavailable state and now marks the disabled input as `readOnly`, so the control no longer sits in a controlled-without-handler gray zone.
  - `Layout/TopBar` now includes `ActionsUnavailable` proof for the non-wired action path.
  - `docs/design/storybook-component-backlog.md` now matches the current `TopBar`, `LoginForm`, and `IconGallery` contracts as proven on this tree.

## UI Workflow Evidence

- Design brief sources:
  - `.impeccable.md`
  - `docs/design/serviceops-design-system.md`
  - `docs/design/ui-workflow.md`
  - `docs/architecture/frontend-architecture.md`
  - `docs/design/storybook-component-backlog.md`
  - `.agent/stages/01-ui-storybook-foundation/sprint_contract.md`
- Lookup query:
  - `stage 01 auth form top bar icon gallery truthfulness login form backlog token bridge refresh`
- Matched story refs from the lookup:
  - `Auth/LoginForm` -> `apps/web/stories/auth/LoginForm.stories.tsx`
  - `Foundations/IconGallery` -> `apps/web/stories/foundations/IconGallery.stories.tsx`
  - `Layout/TopBar` -> `apps/web/stories/layout/TopBar.stories.tsx`
  - `Foundations/TokenDocs` -> `apps/web/stories/foundations/TokenDocs.stories.tsx`
  - `Auth/ConsentRow` -> `apps/web/stories/auth/ConsentRow.stories.tsx`
- Reuse decision:
  - `TopBar` -> `extend`
  - `Token bridge` -> `extend`
  - `LoginForm` -> `reuse`
  - `IconGallery` -> `extend`
- Rationale:
  - the lookup already exposed viable story-backed candidates, so this refresh extended the existing proof-bearing `TopBar`, `IconGallery`, and token bridge instead of creating a parallel reusable family.

## Commands Run

- `python3 .agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py --query 'stage 01 auth form top bar icon gallery truthfulness login form backlog token bridge refresh' > .agent/stages/01-ui-storybook-foundation/raw/2026-04-18-storybook-lookup.txt`
- `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.14.1 >/dev/null; pnpm run web:lint > .agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-lint.txt 2>&1`
- `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.14.1 >/dev/null; pnpm run web:typecheck > .agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-typecheck.txt 2>&1`
- `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.14.1 >/dev/null; pnpm run web:build > .agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-build.txt 2>&1`
- `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.14.1 >/dev/null; pnpm run storybook:build > .agent/stages/01-ui-storybook-foundation/raw/2026-04-18-storybook-build.txt 2>&1`
- `python3 - <<'PY' > .agent/stages/01-ui-storybook-foundation/raw/2026-04-18-story-refs.txt ... PY`
- `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24.14.1 >/dev/null; pnpm run web:smoke > .agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-smoke.txt 2>&1`
- `curl -sL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md > .agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-interface-guidelines-source.md`
- `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 01-ui-storybook-foundation > .agent/stages/01-ui-storybook-foundation/raw/2026-04-18-harness-check.txt 2>&1`

## Tests Run

- `raw/2026-04-18-web-lint.txt` -> PASS
- `raw/2026-04-18-web-typecheck.txt` -> PASS
- `raw/2026-04-18-web-build.txt` -> PASS
- `raw/2026-04-18-storybook-build.txt` -> PASS
- `raw/2026-04-18-story-refs.txt` -> PASS
- `raw/2026-04-18-web-smoke.txt` -> PASS
- `raw/2026-04-18-web-design-guidelines.txt` -> PASS
- `raw/2026-04-18-harness-check.txt` -> PASS

## Story References

- `layout-topbar--search-unavailable`
- `layout-topbar--actions-unavailable`
- `auth-loginform--validation-error`
- `auth-loginform--server-error`
- `foundations-icongallery--navigation-icons`
- `foundations-icongallery--action-icons`
- `foundations-icongallery--file-type-icons`
- `foundations-icongallery--status-icons`

## Artifacts Collected

- `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-storybook-lookup.txt`
- `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-lint.txt`
- `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-typecheck.txt`
- `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-build.txt`
- `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-storybook-build.txt`
- `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-story-refs.txt`
- `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-smoke.txt`
- `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-interface-guidelines-source.md`
- `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-design-guidelines.txt`
- `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-harness-check.txt`
- `apps/web/storybook-static/index.json`

## Changed UI Files

- `apps/web/app/globals.css`
- `apps/web/shared/config/design-tokens.ts`
- `apps/web/stories/foundations/IconGallery.stories.tsx`
- `apps/web/widgets/OperatorShell/ui/TopBar.tsx`
- `apps/web/stories/layout/TopBar.stories.tsx`

## Documentation Updates

- `docs/design/storybook-component-backlog.md`
- Rationale:
  - `TopBar` proof and truthfulness rules changed for non-wired action callbacks;
  - `LoginForm` backlog now matches `fieldErrors` / `formError`;
  - `IconGallery` backlog now matches the actual story-only proof contract.

## UI Review Result

- Fresh `$web-design-guidelines` pass for this cycle: `PASS`
- Review artifact: `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-design-guidelines.txt`
- Guideline source artifact: `.agent/stages/01-ui-storybook-foundation/raw/2026-04-18-web-interface-guidelines-source.md`
- Review scope:
  - `apps/web/app/globals.css`
  - `apps/web/shared/config/design-tokens.ts`
  - `apps/web/stories/foundations/IconGallery.stories.tsx`
  - `apps/web/stories/layout/TopBar.stories.tsx`
  - `apps/web/widgets/OperatorShell/ui/TopBar.tsx`

## Notes

- The first bare-shell `pnpm run web:lint` attempt under Node `20.10.0` failed on the repo engine guard and is intentionally excluded from proof. The authoritative bundle uses Node `24.14.1` through `nvm`.
- `raw/2026-04-18-web-smoke.txt` is the authoritative end-to-end proof artifact for the current tree because it reruns lint, typecheck, Next build, Storybook build, and Playwright browser smoke sequentially on the same pinned Node version.
- `raw/2026-04-18-storybook-build.txt` still contains non-failing Storybook/tooling warnings (`use client` sourcemap noise, large chunk warnings, upstream `eval` warning), but the build completed successfully and those warnings were not introduced by this slice.
