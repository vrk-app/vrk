# ARTIFACTS.md

## Stage artifact directory

Each stage must have:

```text
.agent/stages/<stage-id>/
```

## Required files

### `stage_spec.md`

Frozen scope for the current stage.

Must include:

- objective
- in-scope
- out-of-scope
- source documents
- canonical docs expected to change
- acceptance criteria
- technical paths/modules
- risk list
- verification plan
- diagram expectations for non-trivial flows if applicable

### `feature_list.json`

Machine-friendly structured list of stage features or criteria.

Rules:

- use JSON, not free-form markdown
- do not delete criteria to make progress look better
- only change `passes` to `true` after proof
- each item should be testable

Suggested shape:

```json
[
  {
    "id": "stage03-request-create",
    "category": "functional",
    "description": "Customer can create a request with one work type and one or more equipment items.",
    "steps": [
      "Open customer request create flow",
      "Select work type",
      "Select equipment",
      "Submit request",
      "Verify request persisted and routed"
    ],
    "passes": false,
    "evidence_refs": []
  }
]
```

### `progress.md`

Append-only stage journal.

Every session should add:

- date/time
- what was attempted
- what changed
- what remains
- blockers
- next recommended sprint contract

### `sprint_contract.md`

One implementation slice only.

Must include:

- slice objective
- exact acceptance criteria
- file/module ownership
- documentation targets
- build/test plan
- proof requirements
- documentation proof requirements
- explicit non-goals for the slice

If this is a web UI slice, also include:

- prompt or brief source
- changed UI paths in scope
- the required UI review gate (`$web-design-guidelines`)

### `evidence.md`

Human-readable proof bundle summary.

Include:

- commands run
- tests run
- screenshots/logs collected
- urls/flows exercised
- canonical docs updated
- decisions documented
- diagram refs updated
- known limitations
- mapping from criteria to evidence

If this is a web UI slice, also include:

- prompt or brief source
- changed UI files
- UI review result
- note on how findings were resolved

### `evidence.json`

Machine-readable proof index.

Suggested keys:

- stage_id
- sprint_contract_id
- commands
- artifacts
- tests
- screenshots
- documentation_updates
- diagram_refs
- design_brief_source
- changed_ui_files
- ui_review
- updated_at

### `verdict.json`

Verifier-owned file.

Suggested shape:

```json
{
  "status": "PENDING",
  "summary": "",
  "failed_criteria": [],
  "proof_gaps": [],
  "last_verified_at": null
}
```

Valid statuses:

- `PENDING`
- `FAIL`
- `PASS`

### `problems.md`

Verifier-owned when verdict is not pass.

For each problem include:

- criterion that failed
- why it is not proven
- exact reproduction
- expected vs actual
- suspected ownership
- smallest safe fix direction

### `raw/`

Raw outputs only.

Examples:

- `lint.txt`
- `unit-tests.txt`
- `integration-tests.txt`
- `smoke.txt`
- `playwright.txt`
- `curl-create-request.txt`
- `ui-request-detail.png`
- `web-design-guidelines.txt`

## Ownership rules

- parent orchestrator owns phase transitions
- spec freezer owns `stage_spec.md`, `feature_list.json`, `sprint_contract.md`
- builder owns `evidence.md` and `evidence.json`
- verifier owns `verdict.json` and `problems.md`
- workers never own the final evidence or verdict
- canonical product/technical docs stay outside the stage directory and must be updated in their owning locations
