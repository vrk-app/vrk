#!/usr/bin/env python3
"""Verify the active repo-local VRK harness without bootstrap materials."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


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

REQUIRED_UI_LOOKUP_FILES = (
    "docs/design/ui-workflow.md",
    "docs/design/storybook-component-backlog.md",
    ".agents/skills/vrk-web-ui-workflow/SKILL.md",
    ".agents/skills/vrk-web-ui-workflow/scripts/storybook_component_lookup.py",
)

VALID_VERDICT_STATUSES = {"PENDING", "FAIL", "PASS"}

PLACEHOLDER_MARKERS = (
    ("{{", "template placeholder"),
    ("TBD", "unfinished placeholder"),
    ("Replace this placeholder", "template placeholder"),
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


def read_json(path: Path) -> tuple[Any | None, str | None]:
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except FileNotFoundError:
        return None, f"Missing {path.name}."
    except json.JSONDecodeError as exc:
        return None, f"{path.name} is not valid JSON: {exc.msg}."


def is_iso_timestamp(value: Any) -> bool:
    if not isinstance(value, str) or not value.strip():
        return False
    candidate = value.replace("Z", "+00:00")
    try:
        datetime.fromisoformat(candidate)
    except ValueError:
        return False
    return True


def find_placeholder_markers(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    found: list[str] = []
    for marker, label in PLACEHOLDER_MARKERS:
        if marker in text:
            found.append(f"{path.name}: {label} `{marker}`")
    return found


def validate_stage_freeze(stage_dir: Path) -> list[str]:
    issues: list[str] = []
    for name in ("stage_spec.md", "sprint_contract.md"):
        path = stage_dir / name
        if path.exists():
            issues.extend(find_placeholder_markers(path))
    return issues


def validate_feature_list(stage_dir: Path, repo_root: Path) -> list[str]:
    path = stage_dir / "feature_list.json"
    payload, error = read_json(path)
    if error:
        return [error]
    if not isinstance(payload, list) or not payload:
        return ["feature_list.json must contain a non-empty JSON array."]

    issues: list[str] = []
    for index, item in enumerate(payload, start=1):
        prefix = f"feature_list.json[{index}]"
        if not isinstance(item, dict):
            issues.append(f"{prefix} must be an object.")
            continue

        feature_id = item.get("id")
        category = item.get("category")
        description = item.get("description")
        steps = item.get("steps")
        passes = item.get("passes")
        evidence_refs = item.get("evidence_refs")

        if not isinstance(feature_id, str) or not feature_id.strip():
            issues.append(f"{prefix}.id must be a non-empty string.")
        elif feature_id == "seed-me":
            issues.append(f"{prefix}.id still uses the template placeholder `seed-me`.")

        if not isinstance(category, str) or not category.strip():
            issues.append(f"{prefix}.category must be a non-empty string.")

        if not isinstance(description, str) or not description.strip():
            issues.append(f"{prefix}.description must be a non-empty string.")
        elif "Replace this placeholder" in description:
            issues.append(f"{prefix}.description still contains template text.")

        if not isinstance(steps, list) or not steps:
            issues.append(f"{prefix}.steps must be a non-empty list of strings.")
        elif not all(isinstance(step, str) and step.strip() for step in steps):
            issues.append(f"{prefix}.steps must contain only non-empty strings.")

        if not isinstance(passes, bool):
            issues.append(f"{prefix}.passes must be a boolean.")

        if not isinstance(evidence_refs, list):
            issues.append(f"{prefix}.evidence_refs must be a list of repo-relative paths.")
            continue
        if not all(isinstance(ref, str) and ref.strip() for ref in evidence_refs):
            issues.append(f"{prefix}.evidence_refs must contain only non-empty strings.")
            continue
        if passes and not evidence_refs:
            issues.append(f"{prefix} is marked passed but has no evidence_refs.")
        for ref in evidence_refs:
            if not (repo_root / ref).exists():
                issues.append(f"{prefix}.evidence_refs points to a missing path: {ref}")

    return issues


def validate_evidence_bundle(stage_dir: Path, repo_root: Path, stage_id: str) -> list[str]:
    evidence_path = stage_dir / "evidence.json"
    verdict_path = stage_dir / "verdict.json"

    evidence, evidence_error = read_json(evidence_path)
    verdict, verdict_error = read_json(verdict_path)

    issues: list[str] = []
    if evidence_error:
        issues.append(evidence_error)
        return issues
    if verdict_error:
        issues.append(verdict_error)
        return issues
    if not isinstance(evidence, dict):
        return ["evidence.json must contain a JSON object."]
    if not isinstance(verdict, dict):
        return ["verdict.json must contain a JSON object."]

    if evidence.get("stage_id") != stage_id:
        issues.append(
            f"evidence.json stage_id must match `{stage_id}`, found `{evidence.get('stage_id')}`."
        )

    artifacts = evidence.get("artifacts")
    commands = evidence.get("commands")
    tests = evidence.get("tests")
    if not isinstance(commands, list):
        issues.append("evidence.json.commands must be a list.")
    if not isinstance(tests, list):
        issues.append("evidence.json.tests must be a list.")
    if not isinstance(artifacts, list) or not all(
        isinstance(artifact, str) and artifact.strip() for artifact in artifacts
    ):
        issues.append("evidence.json.artifacts must be a list of repo-relative paths.")
        artifacts = []

    for artifact in artifacts:
        if not (repo_root / artifact).exists():
            issues.append(f"evidence.json.artifacts points to a missing path: {artifact}")

    status = verdict.get("status")
    if status not in VALID_VERDICT_STATUSES:
        issues.append(
            f"verdict.json.status must be one of {sorted(VALID_VERDICT_STATUSES)}, found `{status}`."
        )
        return issues

    if status == "PASS":
        summary = verdict.get("summary")
        if not isinstance(summary, str) or not summary.strip():
            issues.append("verdict.json summary must be non-empty when status is PASS.")
        if not is_iso_timestamp(verdict.get("last_verified_at")):
            issues.append("verdict.json last_verified_at must be an ISO timestamp when status is PASS.")
        if not is_iso_timestamp(evidence.get("updated_at")):
            issues.append("evidence.json updated_at must be an ISO timestamp when verdict status is PASS.")
        if not artifacts:
            issues.append("evidence.json must list artifacts when verdict status is PASS.")
        if not commands:
            issues.append("evidence.json must list commands when verdict status is PASS.")
        if not tests:
            issues.append("evidence.json must list tests when verdict status is PASS.")
        if verdict.get("failed_criteria"):
            issues.append("verdict.json failed_criteria must be empty when status is PASS.")
        if verdict.get("proof_gaps"):
            issues.append("verdict.json proof_gaps must be empty when status is PASS.")

    return issues


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

    ui_lookup_missing = missing_paths(repo_root, REQUIRED_UI_LOOKUP_FILES)
    checks.append(
        CheckResult(
            id="ui-component-lookup",
            status="PASS" if not ui_lookup_missing else "FAIL",
            detail="Storybook component lookup workflow files are present."
            if not ui_lookup_missing
            else f"Missing UI lookup files: {', '.join(ui_lookup_missing)}",
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

    if stage_artifacts["exists"] and not stage_artifacts["missing"]:
        stage_freeze_issues = validate_stage_freeze(stage_dir)
        checks.append(
            CheckResult(
                id="stage-freeze",
                status="PASS" if not stage_freeze_issues else "FAIL",
                detail=f"Stage spec and sprint contract are frozen for {args.stage_id}."
                if not stage_freeze_issues
                else "Stage freeze artifacts still contain placeholders: "
                + "; ".join(stage_freeze_issues),
            )
        )

        feature_list_issues = validate_feature_list(stage_dir, repo_root)
        checks.append(
            CheckResult(
                id="feature-list-quality",
                status="PASS" if not feature_list_issues else "FAIL",
                detail=f"feature_list.json is actionable for {args.stage_id}."
                if not feature_list_issues
                else "feature_list.json has semantic gaps: "
                + "; ".join(feature_list_issues),
            )
        )

        proof_bundle_issues = validate_evidence_bundle(stage_dir, repo_root, args.stage_id)
        checks.append(
            CheckResult(
                id="proof-bundle-consistency",
                status="PASS" if not proof_bundle_issues else "FAIL",
                detail=f"evidence.json and verdict.json are internally consistent for {args.stage_id}."
                if not proof_bundle_issues
                else "Proof bundle has semantic gaps: "
                + "; ".join(proof_bundle_issues),
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
