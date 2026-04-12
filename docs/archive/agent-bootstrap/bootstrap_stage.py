#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from datetime import datetime, timezone

MANAGED_BEGIN = "<!-- BEGIN VRK MVP STAGE ORCHESTRATOR -->"
MANAGED_END = "<!-- END VRK MVP STAGE ORCHESTRATOR -->"

AGENTS_BLOCK = """<!-- BEGIN VRK MVP STAGE ORCHESTRATOR -->
Use the repo-local VRK stage harness for roadmap execution.

Core rules:
- roadmap source of truth: docs/roadmap.md
- durable stage artifacts: .agent/stages/<stage-id>/
- one top-level stage orchestrator per stage run
- bounded leaf subagents only
- one integration builder owns implementation + evidence
- every verify pass must use a fresh verifier
- verifier must not edit production code
- do not mark features or stages done without proof
<!-- END VRK MVP STAGE ORCHESTRATOR -->
"""

REQUIRED_STAGE_FILES = {
    "stage_spec.md": "assets/templates/stage_spec.md",
    "feature_list.json": "assets/templates/feature_list.json",
    "progress.md": "assets/templates/progress.md",
    "sprint_contract.md": "assets/templates/sprint_contract.md",
    "evidence.md": "assets/templates/evidence.md",
    "evidence.json": "assets/templates/evidence.json",
    "verdict.json": "assets/templates/verdict.json",
    "problems.md": "assets/templates/problems.md",
    "raw/README.md": "assets/templates/raw_README.md",
}


def find_repo_root(start: Path) -> Path:
    current = start.resolve()
    for path in [current, *current.parents]:
        if (path / ".git").exists():
            return path
    # Fallback to current if no .git is available
    return current


def render_template(text: str, stage_id: str, stage_name: str) -> str:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return (
        text.replace("{{STAGE_ID}}", stage_id)
        .replace("{{STAGE_NAME}}", stage_name)
        .replace("{{TIMESTAMP}}", now)
    )


def ensure_agents_md(repo_root: Path) -> None:
    path = repo_root / "AGENTS.md"
    if path.exists():
        content = path.read_text(encoding="utf-8")
        if MANAGED_BEGIN in content and MANAGED_END in content:
            before = content.split(MANAGED_BEGIN)[0].rstrip()
            after = content.split(MANAGED_END)[-1].lstrip()
            new_content = f"{before}\n\n{AGENTS_BLOCK}\n\n{after}".strip() + "\n"
        elif AGENTS_BLOCK in content:
            new_content = content
        else:
            new_content = content.rstrip() + "\n\n" + AGENTS_BLOCK + "\n"
    else:
        new_content = "# AGENTS.md\n\n" + AGENTS_BLOCK + "\n"
    path.write_text(new_content, encoding="utf-8")


def install_agents(skill_root: Path, repo_root: Path) -> None:
    source_dir = skill_root / "assets" / "agents"
    target_dir = repo_root / ".codex" / "agents"
    target_dir.mkdir(parents=True, exist_ok=True)
    for file in source_dir.glob("*.toml"):
        shutil.copy2(file, target_dir / file.name)

    config_example = skill_root / "assets" / "config.toml.example"
    config_target = repo_root / ".codex" / "config.vrk-example.toml"
    config_target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(config_example, config_target)

    (repo_root / ".agent" / "stages").mkdir(parents=True, exist_ok=True)
    ensure_agents_md(repo_root)


def init_stage(skill_root: Path, repo_root: Path, stage_id: str, stage_name: str) -> None:
    stage_dir = repo_root / ".agent" / "stages" / stage_id
    stage_dir.mkdir(parents=True, exist_ok=True)

    for relative_target, source_rel in REQUIRED_STAGE_FILES.items():
        source = skill_root / source_rel
        target = stage_dir / relative_target
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            rendered = render_template(source.read_text(encoding="utf-8"), stage_id, stage_name)
            target.write_text(rendered, encoding="utf-8")


def stage_status(repo_root: Path, stage_id: str) -> dict:
    stage_dir = repo_root / ".agent" / "stages" / stage_id
    present = stage_dir.exists()
    result = {
        "stage_id": stage_id,
        "stage_dir": str(stage_dir),
        "exists": present,
        "missing": [],
        "present": [],
    }
    if not present:
        return result
    for relative_target in REQUIRED_STAGE_FILES:
        target = stage_dir / relative_target
        if target.exists():
            result["present"].append(relative_target)
        else:
            result["missing"].append(relative_target)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap the VRK MVP stage harness.")
    sub = parser.add_subparsers(dest="command", required=True)

    install_parser = sub.add_parser("install", help="Install project-scoped agents and AGENTS.md block.")
    install_parser.add_argument("--repo-root", default=".", help="Repository root or any path inside the repository.")

    init_parser = sub.add_parser("init-stage", help="Initialize one stage artifact directory.")
    init_parser.add_argument("--repo-root", default=".", help="Repository root or any path inside the repository.")
    init_parser.add_argument("--stage-id", required=True, help="Stage identifier.")
    init_parser.add_argument("--stage-name", default="", help="Human-readable stage name.")

    status_parser = sub.add_parser("status", help="Show stage artifact status as JSON.")
    status_parser.add_argument("--repo-root", default=".", help="Repository root or any path inside the repository.")
    status_parser.add_argument("--stage-id", required=True, help="Stage identifier.")

    args = parser.parse_args()
    skill_root = Path(__file__).resolve().parent.parent
    repo_root = find_repo_root(Path(args.repo_root))

    if args.command == "install":
        install_agents(skill_root, repo_root)
        print(json.dumps({
            "installed": True,
            "repo_root": str(repo_root),
            "agents_dir": str(repo_root / ".codex" / "agents"),
            "config_example": str(repo_root / ".codex" / "config.vrk-example.toml"),
            "agents_md": str(repo_root / "AGENTS.md"),
        }, ensure_ascii=False, indent=2))
    elif args.command == "init-stage":
        stage_name = args.stage_name or args.stage_id
        init_stage(skill_root, repo_root, args.stage_id, stage_name)
        print(json.dumps(stage_status(repo_root, args.stage_id), ensure_ascii=False, indent=2))
    elif args.command == "status":
        print(json.dumps(stage_status(repo_root, args.stage_id), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
