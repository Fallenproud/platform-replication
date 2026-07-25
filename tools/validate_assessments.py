#!/usr/bin/env python3
"""Validate repository assessment records without external dependencies."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ASSESSMENTS = ROOT / "assessments"

REQUIRED_TOP_LEVEL = {
    "repository",
    "upstream",
    "license",
    "runtime",
    "scores",
    "target",
    "disposition",
    "evidence",
}
REQUIRED_SCORES = {
    "product_fit",
    "license_confidence",
    "self_hostability",
    "independence",
    "maintenance",
    "security",
    "integration_cost",
    "replacement_difficulty",
}
DISPOSITIONS = {"ADOPT", "FORK", "REFERENCE", "REJECT", "UNDECIDED"}
LICENSE_STATES = {"verified", "unverified", "conflict", "missing"}
DEPENDENCY_STATES = {"pending", "passed", "failed", "conditional"}
SELF_HOSTABLE = {"yes", "partial", "no", "unknown"}
REPOSITORY_PATTERN = re.compile(r"^[^/\s]+/[^/\s]+$")
PIN_PATTERN = re.compile(r"^[0-9a-fA-F]{7,40}$")


def fail(errors: list[str], path: Path, message: str) -> None:
    errors.append(f"{path.relative_to(ROOT)}: {message}")


def require_object(errors: list[str], path: Path, value: Any, name: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(errors, path, f"{name} must be an object")
        return {}
    return value


def validate(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001 - validation CLI should report all parse failures
        return [f"{path.relative_to(ROOT)}: invalid JSON: {exc}"]

    if not isinstance(data, dict):
        return [f"{path.relative_to(ROOT)}: document must be a JSON object"]

    missing = sorted(REQUIRED_TOP_LEVEL - data.keys())
    if missing:
        fail(errors, path, f"missing required keys: {', '.join(missing)}")

    repository = data.get("repository")
    if not isinstance(repository, str) or not REPOSITORY_PATTERN.match(repository):
        fail(errors, path, "repository must use owner/name form")

    upstream = require_object(errors, path, data.get("upstream"), "upstream")
    for key in ("default_branch", "pinned_ref", "archived"):
        if key not in upstream:
            fail(errors, path, f"upstream.{key} is required")
    if not isinstance(upstream.get("default_branch"), str) or not upstream.get("default_branch"):
        fail(errors, path, "upstream.default_branch must be a non-empty string")
    pinned_ref = upstream.get("pinned_ref")
    if not isinstance(pinned_ref, str) or not PIN_PATTERN.match(pinned_ref):
        fail(errors, path, "upstream.pinned_ref must be a 7-40 character commit SHA")
    if not isinstance(upstream.get("archived"), bool):
        fail(errors, path, "upstream.archived must be boolean")

    license_data = require_object(errors, path, data.get("license"), "license")
    if license_data.get("status") not in LICENSE_STATES:
        fail(errors, path, f"license.status must be one of {sorted(LICENSE_STATES)}")
    if not isinstance(license_data.get("identifier"), str) or not license_data.get("identifier"):
        fail(errors, path, "license.identifier must be a non-empty string")
    if not isinstance(license_data.get("notice_required"), bool):
        fail(errors, path, "license.notice_required must be boolean")
    if license_data.get("dependency_review") not in DEPENDENCY_STATES:
        fail(errors, path, f"license.dependency_review must be one of {sorted(DEPENDENCY_STATES)}")

    runtime = require_object(errors, path, data.get("runtime"), "runtime")
    if not isinstance(runtime.get("build_reproduced"), bool):
        fail(errors, path, "runtime.build_reproduced must be boolean")
    if runtime.get("self_hostable") not in SELF_HOSTABLE:
        fail(errors, path, f"runtime.self_hostable must be one of {sorted(SELF_HOSTABLE)}")
    private_dependencies = runtime.get("private_dependencies")
    if not isinstance(private_dependencies, list) or not all(isinstance(item, str) for item in private_dependencies):
        fail(errors, path, "runtime.private_dependencies must be an array of strings")

    scores = require_object(errors, path, data.get("scores"), "scores")
    if set(scores) != REQUIRED_SCORES:
        missing_scores = sorted(REQUIRED_SCORES - scores.keys())
        extra_scores = sorted(scores.keys() - REQUIRED_SCORES)
        if missing_scores:
            fail(errors, path, f"scores missing: {', '.join(missing_scores)}")
        if extra_scores:
            fail(errors, path, f"scores contain unsupported keys: {', '.join(extra_scores)}")
    for key in REQUIRED_SCORES:
        value = scores.get(key)
        if not isinstance(value, int) or isinstance(value, bool) or not 0 <= value <= 5:
            fail(errors, path, f"scores.{key} must be an integer from 0 to 5")

    if data.get("disposition") not in DISPOSITIONS:
        fail(errors, path, f"disposition must be one of {sorted(DISPOSITIONS)}")
    if not isinstance(data.get("target"), str) or not data.get("target"):
        fail(errors, path, "target must be a non-empty string")
    evidence = data.get("evidence")
    if not isinstance(evidence, list) or not evidence or not all(isinstance(item, str) and item for item in evidence):
        fail(errors, path, "evidence must contain at least one non-empty string")
    conditions = data.get("conditions", [])
    if not isinstance(conditions, list) or not all(isinstance(item, str) for item in conditions):
        fail(errors, path, "conditions must be an array of strings")

    return errors


def main() -> int:
    files = sorted(ASSESSMENTS.rglob("*.json")) if ASSESSMENTS.exists() else []
    if not files:
        print("No assessment JSON files found", file=sys.stderr)
        return 1

    errors: list[str] = []
    for path in files:
        errors.extend(validate(path))

    if errors:
        print("Assessment validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Validated {len(files)} assessment record(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
