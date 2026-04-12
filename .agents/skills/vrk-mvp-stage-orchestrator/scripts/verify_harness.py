#!/usr/bin/env python3
"""Verify the active repo-local VRK harness without bootstrap materials."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


REQUIRED_STAGE_FILES = (
    "stage_spec.md",
    "feature_list.json",
    "progress.md",
    "sprint_contract.md",
    "evidence.md",
    "evidence.json",
    "verdict.json",
    "problems.md",
    "raw",
)

REQUIRED_AGENT_FILES = (
    "vrk_stage_builder.toml",
    "vrk_stage_explorer.toml",
    "vrk_stage_fixer.toml",
    "vrk_stage_spec_freezer.toml",
    "vrk_stage_verifier.toml",
)


@dataclass
class CheckResult:
    id: str
    status: str
    detail: str


def find_repo_root(start: Path) -> Path:
    for candidate in (start, *start.parents):
        if (candidate / "AGENTS.md").exists() and (candidate / ".agent").exists():
            return candidate
    raise SystemExit("Could not locate repo root from script path.")


def has_managed_harness_block(agents_md: Path) -> bool:
    text = agents_md.read_text(encoding="utf-8")
    return (
        "<!-- BEGIN VRK MVP STAGE ORCHESTRATOR -->" in text
        and "<!-- END VRK MVP STAGE ORCHESTRATOR -->" in text
    )


def missing_paths(base: Path, entries: Iterable[str]) -> list[str]:
    missing: list[str] = []
    for entry in entries:
        if not (base / entry).exists():
            missing.append(str((base / entry).relative_to(base)))
    return missing


def expected_stage_dirs() -> list[str]:
    return [
        "00-harness-and-source-of-truth",
        "01-ui-storybook-foundation",
        "02-platform-foundation",
        "03-identity-master-data",
        "04-request-core-and-customer-cabinet",
        "05-contractor-execution",
        "06-field-engineer-offline",
        "07-acceptance-reporting-hardening-release",
    ]


def collect_stage_artifacts(stage_dir: Path) -> dict[str, object]:
    missing = missing_paths(stage_dir, REQUIRED_STAGE_FILES)
    return {
        "path": str(stage_dir),
        "exists": stage_dir.exists(),
        "missing": missing,
        "present": sorted(
            entry
            for entry in REQUIRED_STAGE_FILES
            if (stage_dir / entry).exists()
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Verify the active repo-local VRK stage harness."
    )
    parser.add_argument(
        "--stage-id",
        default="00-harness-and-source-of-truth",
        help="Stage directory name to inspect in .agent/stages/.",
    )
    args = parser.parse_args()

    repo_root = find_repo_root(Path(__file__).resolve())

    agents_md = repo_root / "AGENTS.md"
    skill_root = repo_root / ".agents" / "skills" / "vrk-mvp-stage-orchestrator"
    codex_dir = repo_root / ".codex"
    codex_agents_dir = codex_dir / "agents"
    documentation_workflow = (
        repo_root / "docs" / "architecture" / "documentation-workflow.md"
    )
    stages_dir = repo_root / ".agent" / "stages"
    stage_dir = stages_dir / args.stage_id

    checks: list[CheckResult] = []

    managed_block_ok = agents_md.exists() and has_managed_harness_block(agents_md)
    checks.append(
        CheckResult(
            id="agents-managed-block",
            status="PASS" if managed_block_ok else "FAIL",
            detail="AGENTS.md contains the managed VRK harness block."
            if managed_block_ok
            else "AGENTS.md is missing the managed VRK harness block.",
        )
    )

    skill_missing = missing_paths(
        skill_root,
        (
            "SKILL.md",
            "references/ARTIFACTS.md",
            "references/PROTOCOL.md",
            "references/SUBAGENTS.md",
        ),
    )
    checks.append(
        CheckResult(
            id="skill-layout",
            status="PASS" if not skill_missing else "FAIL",
            detail="Repo-local orchestrator skill files are present."
            if not skill_missing
            else f"Missing skill files: {', '.join(skill_missing)}",
        )
    )

    documentation_workflow_exists = documentation_workflow.exists()
    checks.append(
        CheckResult(
            id="documentation-workflow",
            status="PASS" if documentation_workflow_exists else "FAIL",
            detail="Documentation workflow source of truth is present."
            if documentation_workflow_exists
            else "Missing docs/architecture/documentation-workflow.md.",
        )
    )

    config_exists = (codex_dir / "config.toml").exists()
    checks.append(
        CheckResult(
            id="codex-config",
            status="PASS" if config_exists else "FAIL",
            detail=".codex/config.toml is present."
            if config_exists
            else ".codex/config.toml is missing.",
        )
    )

    agent_missing = missing_paths(codex_agents_dir, REQUIRED_AGENT_FILES)
    checks.append(
        CheckResult(
            id="codex-agents",
            status="PASS" if not agent_missing else "FAIL",
            detail="Stage agent definitions are present in .codex/agents."
            if not agent_missing
            else f"Missing agent definitions: {', '.join(agent_missing)}",
        )
    )

    expected_dirs = expected_stage_dirs()
    missing_stage_dirs = missing_paths(stages_dir, expected_dirs)
    checks.append(
        CheckResult(
            id="stage-directories",
            status="PASS" if not missing_stage_dirs else "FAIL",
            detail="Expected stage directories 00..07 are present."
            if not missing_stage_dirs
            else f"Missing stage directories: {', '.join(missing_stage_dirs)}",
        )
    )

    stage_artifacts = collect_stage_artifacts(stage_dir)
    checks.append(
        CheckResult(
            id="stage-artifacts",
            status="PASS"
            if stage_artifacts["exists"] and not stage_artifacts["missing"]
            else "FAIL",
            detail=f"Stage artifacts are complete for {args.stage_id}."
            if stage_artifacts["exists"] and not stage_artifacts["missing"]
            else f"Stage artifacts are incomplete for {args.stage_id}: {stage_artifacts['missing']}",
        )
    )

    overall_status = "PASS" if all(check.status == "PASS" for check in checks) else "FAIL"

    report = {
        "status": overall_status,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "repo_root": str(repo_root),
        "stage_id": args.stage_id,
        "checks": [asdict(check) for check in checks],
        "stage_directories": {
            "path": str(stages_dir),
            "expected": expected_dirs,
            "missing": missing_stage_dirs,
            "present": sorted(
                path.name for path in stages_dir.iterdir() if path.is_dir()
            )
            if stages_dir.exists()
            else [],
        },
        "stage_artifacts": stage_artifacts,
    }

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
