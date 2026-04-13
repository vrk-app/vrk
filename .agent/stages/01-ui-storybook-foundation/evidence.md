# Evidence

- Stage ID: `01-ui-storybook-foundation`
- Sprint contract: `slice-002-wave1-shell-auth-request-showcases`

## Prior proven slice

- `slice-001-storybook-scaffold-and-foundations` remains proven and is still part of the Stage 01 bundle.
- The canonical Stage 01 docs synced during earlier passes remain valid:
  - `README.md`
  - `docs/onboarding.md`
  - `docs/architecture/source-of-truth.md`
  - `docs/architecture/frontend-architecture.md`

## 2026-04-13 Findings Fix Cycle

- Reopened the proof loop after an external review reported 10 material findings against the current `stage-01` tree.
- Closed the findings without expanding Stage 01 scope:
  - `TopBar` no longer exposes an enabled-but-dead controlled search field; the non-wired path is explicitly unavailable.
  - `AppShell` no longer leaks preview-only banner copy into runtime code.
  - `SidebarNav` keeps desktop collapsed behavior but always renders a full mobile drawer, with explicit Storybook proof for `collapsed + mobileOpen`.
  - `RequestListItem` no longer renders a fake note link; the row now exposes truthful note copy.
  - `RequestListItem` now clamps progress to `0..100` for both label and fill width.
  - `RequestList` derives the empty state from `total=0` instead of relying only on a separate `empty` prop.
  - `ConsentRow` no longer duplicates the same error message in both the accessible label and description paths.
  - `Badge` semantic soft tones now use stronger semantic inks that meet AA contrast.
  - `TokenDocs` typography samples now render the exact documented metrics instead of Tailwind defaults.
- `Card` now has a truthful `plain / bordered / elevated` split and Storybook proves distinct states.
- No new product, architecture, or workflow decision was introduced in this cycle; the fixes realign code and proof with the existing source of truth in:
  - `docs/design/serviceops-design-system.md`
  - `docs/design/storybook-component-backlog.md`
  - `docs/design/ui-workflow.md`
  - `docs/architecture/frontend-architecture.md`
- A fresh verifier then flagged canonical backlog drift on the changed public contracts, so the cycle also synced `docs/design/storybook-component-backlog.md` for:
  - `AppShell`
  - `SidebarNav`
  - `TopBar`
  - `RequestListItem`

## Commands Run

- `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/verify_harness.py --stage-id 01-ui-storybook-foundation > .agent/stages/01-ui-storybook-foundation/raw/post-findings-harness-check.txt 2>&1`
- `curl -sL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md > .agent/stages/01-ui-storybook-foundation/raw/post-findings-web-interface-guidelines-source.md`
- `pnpm run web:lint`
- `pnpm run web:typecheck`
- `pnpm run web:build`
- `pnpm run storybook:build`
- `pnpm run web:smoke > .agent/stages/01-ui-storybook-foundation/raw/post-findings-web-smoke.txt 2>&1`

## Tests Run

- `pnpm run web:lint` -> PASS
- `pnpm run web:typecheck` -> PASS
- `pnpm run web:build` -> PASS
- `pnpm run storybook:build` -> PASS
- `pnpm run web:smoke` -> PASS
- `raw/post-findings-harness-check.txt` -> PASS
- `raw/post-findings-story-refs.txt` -> PASS for the latest review-driven proof states
- `raw/post-findings-web-design-guidelines.txt` -> PASS

## Story References

- `layout-topbar--search-unavailable`
- `layout-sidebarnav--collapsed-mobile-drawer`
- `requests-requestlistitem--zero-progress`
- `requests-requestlistitem--overflow-input`
- `requests-requestlist--derived-empty-from-total`
- `auth-consentrow--error`
- `primitives-badge--success`
- `primitives-badge--warning`
- `primitives-badge--danger`
- `primitives-badge--with-icon`
- `foundations-tokendocs--typography`
- `primitives-card--base`
- `primitives-card--bordered`
- `primitives-card--elevated`
- `showcases-requestspage--showcase`

## Artifacts Collected

- `.agent/stages/01-ui-storybook-foundation/raw/post-findings-harness-check.txt`
- `.agent/stages/01-ui-storybook-foundation/raw/post-findings-web-smoke.txt`
- `.agent/stages/01-ui-storybook-foundation/raw/post-findings-story-refs.txt`
- `.agent/stages/01-ui-storybook-foundation/raw/post-findings-web-interface-guidelines-source.md`
- `.agent/stages/01-ui-storybook-foundation/raw/post-findings-web-design-guidelines.txt`
- `apps/web/storybook-static/index.json`

## Changed UI Files

- `apps/web/app/globals.css`
- `apps/web/entities/Request/ui/RequestList.tsx`
- `apps/web/entities/Request/ui/RequestListItem.tsx`
- `apps/web/shared/config/design-tokens.ts`
- `apps/web/shared/storybook/fixtures.tsx`
- `apps/web/shared/ui/Badge.tsx`
- `apps/web/shared/ui/Card.tsx`
- `apps/web/stories/foundations/TokenDocs.stories.tsx`
- `apps/web/stories/layout/AppShell.stories.tsx`
- `apps/web/stories/layout/SidebarNav.stories.tsx`
- `apps/web/stories/layout/TopBar.stories.tsx`
- `apps/web/stories/primitives/Card.stories.tsx`
- `apps/web/stories/requests/RequestList.stories.tsx`
- `apps/web/stories/requests/RequestListItem.stories.tsx`
- `apps/web/widgets/Auth/ui/ConsentRow.tsx`
- `apps/web/widgets/OperatorShell/ui/AppShell.tsx`
- `apps/web/widgets/OperatorShell/ui/SidebarNav.tsx`
- `apps/web/widgets/OperatorShell/ui/TopBar.tsx`

## Canonical Docs

- `docs/design/storybook-component-backlog.md`
- Rationale: the findings-fix cycle changed the effective public contracts/proof states for `AppShell`, `SidebarNav`, `TopBar`, and `RequestListItem`, so the source backlog had to be synced before Stage 01 could be proven again.

## Diagram Refs

- `docs/architecture/frontend-architecture.md` section `1.1. Текущий Stage 01 baseline`

## UI Review Result

- Fresh `$web-design-guidelines` pass for this cycle: `PASS`
- Review artifact: `.agent/stages/01-ui-storybook-foundation/raw/post-findings-web-design-guidelines.txt`
- Guideline source artifact: `.agent/stages/01-ui-storybook-foundation/raw/post-findings-web-interface-guidelines-source.md`
- Leaf-agent focused reviews and the fresh verifier-side UI review found no remaining Web Interface Guidelines gaps in the changed slice.

## Notes

- During orchestration, standalone `web:typecheck` and `web:build` briefly conflicted when launched in parallel against shared `.next` artifacts. The authoritative proof for this cycle is the sequential `post-findings-web-smoke.txt` bundle plus the standalone sequential reruns recorded above.
- This cycle supersedes the earlier `post-review-*` bundle for the current tree.
- A fresh verifier failed once on doc-sync drift, that drift is now closed in `docs/design/storybook-component-backlog.md`, and the final fresh verifier pass now records `PASS` in `verdict.json`.
