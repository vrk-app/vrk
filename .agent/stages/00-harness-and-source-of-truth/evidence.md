# Evidence

- Stage ID: 00-harness-and-source-of-truth

## Commands run

- `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/bootstrap_stage.py install`
- `cp .codex/config.vrk-example.toml .codex/config.toml`
- `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/bootstrap_stage.py init-stage --stage-id 00-harness-and-source-of-truth --stage-name "Harness and source of truth"`
- `python3 .agents/skills/vrk-mvp-stage-orchestrator/scripts/bootstrap_stage.py status --stage-id 00-harness-and-source-of-truth`
- bootstrap init-stage loop for original roadmap stages `01..06`
- manual renumbering of durable stage directories to `00..07` and insertion of `01-ui-storybook-foundation`
- repo inspection commands against `README.md`, `docs/PRD-MVP.md`, `BACKEND.md`, `apps/backend/`, and `git log`
- `go test ./...` in `apps/backend` (blocked: `go` command missing)
- `go build ./...` in `apps/backend` (blocked: `go` command missing)
- `npx skills add pbakaus/impeccable -g --skill impeccable --skill polish -y --copy`
- `npx skills add vercel-labs/agent-skills -g --skill web-design-guidelines -y --copy`
- `curl -fsSL https://vercel.com/design/guidelines/install | bash`
- copy official Codex-flavored `impeccable`, `polish`, and `web-design-guidelines` into `~/.codex/skills`
- copy official Cursor-flavored `impeccable` and `polish` into `~/.cursor/skills`
- initialize `.agents/skills/vrk-web-ui-workflow` via `init_skill.py`

## Tests run

- Harness install/status check: passed
- Stage directory seeding check: passed
- Document inventory check for architecture/testing docs: passed
- Backend compile/smoke check: blocked by missing Go toolchain in the current environment
- Global UI tool discovery check: passed
- Project wrapper skill discovery check: passed

## UI / API flows exercised

- repo-local harness bootstrap flow
- Stage 00 artifact seeding flow
- roadmap stage directory seeding flow
- roadmap renumbering and Storybook foundation stage insertion flow
- source-of-truth freeze based on current repo documents and backend structure
- global UI workflow installation and discovery flow
- repo-local UI workflow wrapper/harness integration flow

## Artifacts collected

- `docs/architecture/source-of-truth.md`
- `docs/architecture/adr/0001-stack-boundaries.md`
- `docs/architecture/adr/0002-mvp-scope-guardrails.md`
- `docs/architecture/adr/0003-request-status-model.md`
- `docs/architecture/adr/0004-offline-sync-approach.md`
- `docs/testing/test-strategy.md`
- `.impeccable.md`
- `docs/design/ui-workflow.md`
- `docs/design/storybook-component-backlog.md`
- `.agents/skills/vrk-web-ui-design/`
- `.agents/skills/vrk-web-ui-workflow/`
- `.agents/skills/vendor/impeccable/`
- `.agents/skills/vendor/polish/`
- `.agent/stages/01-ui-storybook-foundation/`
- `.agent/stages/00-harness-and-source-of-truth/raw/bootstrap-install.json`
- `.agent/stages/00-harness-and-source-of-truth/raw/stage00-status.json`
- `.agent/stages/00-harness-and-source-of-truth/raw/stage-directories.txt`
- `.agent/stages/00-harness-and-source-of-truth/raw/doc-inventory.txt`
- `.agent/stages/00-harness-and-source-of-truth/raw/backend-go-test.txt`
- `.agent/stages/00-harness-and-source-of-truth/raw/backend-go-build.txt`
- `.agent/stages/00-harness-and-source-of-truth/raw/global-skills.json`
- `.agent/stages/00-harness-and-source-of-truth/raw/project-skills.json`
- `.agent/stages/00-harness-and-source-of-truth/raw/ui-tool-install.txt`
- `.agent/stages/00-harness-and-source-of-truth/raw/ui-workflow-inventory.txt`

## Notes / limitations

- Fresh verifier has not been run yet in this session, so Stage 00 cannot be marked complete.
- The current execution environment does not provide `go`, so backend compile/test smoke could not be completed locally.
- `roadmap_mvp.md` previously duplicated the Codex-oriented roadmap text; for agent execution the authoritative file is now `docs/roadmap.md`.
- Storybook backlog integration updates the durable stage map to `00..07`; Stage 00 still requires a fresh verifier before closure.
- `quick_validate.py` for the wrapper skill could not be used as-is because the local Python environment does not have `yaml` installed; discovery was verified via `npx skills ls` instead.
