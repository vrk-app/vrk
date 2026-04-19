from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "verify_harness.py"
SPEC = importlib.util.spec_from_file_location("verify_harness", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC is not None and SPEC.loader is not None
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


class VerifyHarnessSemanticChecksTest(unittest.TestCase):
    def test_stage_freeze_detects_placeholders(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            stage_dir = Path(tmp)
            write(stage_dir / "stage_spec.md", "# Stage Spec\n\n## Objective\n\nTBD\n")
            write(stage_dir / "sprint_contract.md", "# Sprint Contract\n\n## Objective\n\n{{OBJECTIVE}}\n")

            issues = MODULE.validate_stage_freeze(stage_dir)

            self.assertTrue(any("stage_spec.md" in issue for issue in issues))
            self.assertTrue(any("sprint_contract.md" in issue for issue in issues))

    def test_feature_list_requires_steps_and_evidence_for_passed_items(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp)
            stage_dir = repo_root / ".agent" / "stages" / "03-identity-master-data"
            stage_dir.mkdir(parents=True, exist_ok=True)
            write(
                stage_dir / "feature_list.json",
                json.dumps(
                    [
                        {
                            "id": "stage03-shell",
                            "category": "functional",
                            "description": "Proof-bearing feature.",
                            "steps": [],
                            "passes": True,
                            "evidence_refs": [],
                        }
                    ]
                ),
            )

            issues = MODULE.validate_feature_list(stage_dir, repo_root)

            self.assertIn(
                "feature_list.json[1].steps must be a non-empty list of strings.",
                issues,
            )
            self.assertIn(
                "feature_list.json[1] is marked passed but has no evidence_refs.",
                issues,
            )

    def test_proof_bundle_checks_stage_id_and_artifact_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp)
            stage_dir = repo_root / ".agent" / "stages" / "02-platform-foundation"
            stage_dir.mkdir(parents=True, exist_ok=True)
            write(
                stage_dir / "evidence.json",
                json.dumps(
                    {
                        "stage_id": "wrong-stage",
                        "commands": ["python3 verify_harness.py"],
                        "tests": ["PASS"],
                        "artifacts": [".agent/stages/02-platform-foundation/raw/missing.txt"],
                        "updated_at": "2026-04-18T18:07:50Z",
                    }
                ),
            )
            write(
                stage_dir / "verdict.json",
                json.dumps(
                    {
                        "status": "PASS",
                        "summary": "Bundle passed.",
                        "failed_criteria": [],
                        "proof_gaps": [],
                        "last_verified_at": "2026-04-18T18:07:50Z",
                    }
                ),
            )

            issues = MODULE.validate_evidence_bundle(
                stage_dir, repo_root, "02-platform-foundation"
            )

            self.assertIn(
                "evidence.json stage_id must match `02-platform-foundation`, found `wrong-stage`.",
                issues,
            )
            self.assertIn(
                "evidence.json.artifacts points to a missing path: .agent/stages/02-platform-foundation/raw/missing.txt",
                issues,
            )


if __name__ == "__main__":
    unittest.main()
