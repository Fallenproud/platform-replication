#!/usr/bin/env python3
"""Apply version-pinned, evidence-backed license metadata overrides.

This post-processor updates the generated dependency inventory, CSV, CycloneDX
SBOM, and Markdown summary. It never invents a license: every override must
include at least one evidence reference in compliance/license-overrides.json.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import uuid
from collections import Counter
from pathlib import Path
from typing import Any


CSV_FIELDS = [
    "name",
    "version",
    "ecosystem",
    "license",
    "license_file",
    "license_evidence",
    "homepage",
    "repository",
    "source",
    "purl",
    "direct",
]


def load_json(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"Expected object in {path}")
    return payload


def key(ecosystem: str, name: str, version: str) -> tuple[str, str, str]:
    return ecosystem.casefold(), name.casefold(), version


def load_overrides(path: Path) -> dict[tuple[str, str, str], dict[str, Any]]:
    payload = load_json(path)
    records = payload.get("overrides")
    if not isinstance(records, list):
        raise ValueError("Override registry must contain an overrides array")

    result: dict[tuple[str, str, str], dict[str, Any]] = {}
    for record in records:
        if not isinstance(record, dict):
            raise ValueError("Override entries must be objects")
        required = ("ecosystem", "name", "version", "license", "reason", "evidence")
        missing = [field for field in required if not record.get(field)]
        if missing:
            raise ValueError(f"Override is missing fields {missing}: {record}")
        if not isinstance(record["evidence"], list) or not record["evidence"]:
            raise ValueError(f"Override lacks evidence: {record}")
        record_key = key(record["ecosystem"], record["name"], record["version"])
        if record_key in result:
            raise ValueError(f"Duplicate override for {record_key}")
        result[record_key] = record
    return result


def apply_to_inventory(
    inventory: dict[str, Any],
    overrides: dict[tuple[str, str, str], dict[str, Any]],
) -> tuple[int, list[dict[str, Any]]]:
    components = inventory.get("components")
    if not isinstance(components, list):
        raise ValueError("Dependency inventory lacks components")

    applied = 0
    for component in components:
        component_key = key(component["ecosystem"], component["name"], component["version"])
        override = overrides.get(component_key)
        if override is None:
            component.setdefault("license_evidence", [])
            continue
        component["license_original"] = component.get("license", "NOASSERTION")
        component["license"] = override["license"]
        component["license_override_reason"] = override["reason"]
        component["license_evidence"] = override["evidence"]
        applied += 1

    unknown = [component for component in components if component.get("license") == "NOASSERTION"]
    inventory["license_override_count"] = applied
    inventory["unknown_license_count"] = len(unknown)
    inventory["license_override_registry"] = "compliance/license-overrides.json"
    return applied, components


def write_inventory(path: Path, inventory: dict[str, Any]) -> None:
    path.write_text(json.dumps(inventory, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_csv(path: Path, components: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        for component in sorted(components, key=lambda row: (row["name"].casefold(), row["version"])):
            row = dict(component)
            row["license_evidence"] = "; ".join(component.get("license_evidence") or [])
            writer.writerow(row)


def update_sbom(
    path: Path,
    repository: str,
    revision: str,
    components: list[dict[str, Any]],
) -> None:
    sbom = load_json(path)
    by_purl = {component["purl"]: component for component in components}
    for sbom_component in sbom.get("components", []):
        component = by_purl.get(sbom_component.get("purl"))
        if component is None:
            continue
        sbom_component["licenses"] = [{"license": {"name": component["license"]}}]
        properties = [
            item
            for item in sbom_component.get("properties", [])
            if item.get("name") not in {"amarax:license-evidence", "amarax:license-override"}
        ]
        evidence = component.get("license_evidence") or []
        if evidence:
            properties.append({"name": "amarax:license-override", "value": "true"})
            properties.append({"name": "amarax:license-evidence", "value": "; ".join(evidence)})
        sbom_component["properties"] = properties

    sbom["serialNumber"] = f"urn:uuid:{uuid.uuid5(uuid.NAMESPACE_URL, repository + '@' + revision)}"
    sbom.setdefault("metadata", {}).setdefault("properties", []).append(
        {"name": "amarax:license-override-registry", "value": "compliance/license-overrides.json"}
    )
    path.write_text(json.dumps(sbom, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_summary(
    path: Path,
    inventory: dict[str, Any],
    components: list[dict[str, Any]],
    applied: int,
) -> None:
    counts = Counter(component["license"] for component in components)
    unknown = [component for component in components if component["license"] == "NOASSERTION"]
    overridden = [component for component in components if component.get("license_evidence")]

    lines = [
        f"# Dependency Evidence — {inventory['repository']}",
        "",
        f"- Pinned revision: `{inventory['pinned_revision']}`",
        f"- Generation mode: `{inventory['mode']}`",
        f"- Generated: `{inventory['generated_at']}`",
        f"- Components: **{len(components)}**",
        f"- Evidence-backed metadata overrides: **{applied}**",
        f"- Components without normalized license metadata: **{len(unknown)}**",
        "",
        "## License metadata summary",
        "",
        "| License metadata | Components |",
        "|---|---:|",
    ]
    for license_name, count in sorted(counts.items(), key=lambda item: (-item[1], item[0])):
        lines.append(f"| {license_name.replace('|', '/')} | {count} |")

    if overridden:
        lines.extend(["", "## Applied evidence overrides", "", "| Package | Resolved license | Evidence |", "|---|---|---|"])
        for component in sorted(overridden, key=lambda row: row["name"].casefold()):
            evidence = "<br>".join(component.get("license_evidence") or [])
            lines.append(
                f"| `{component['name']}@{component['version']}` | {component['license']} | {evidence} |"
            )

    if unknown:
        lines.extend(["", "## Unresolved metadata", ""])
        for component in unknown:
            lines.append(f"- `{component['name']}@{component['version']}`")

    lines.extend(
        [
            "",
            "## Interpretation",
            "",
            "This is automated package metadata plus explicit evidence corrections, not legal approval. Ambiguous expressions, license files, vendored sources, assets, models, datasets, generated code, build scripts, patents and non-package content still require separate review.",
            "",
        ]
    )
    path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", type=Path, required=True)
    parser.add_argument("--overrides", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    inventory_path = args.directory / "dependency-inventory.json"
    csv_path = args.directory / "licenses.csv"
    sbom_path = args.directory / "sbom.cdx.json"
    summary_path = args.directory / "SUMMARY.md"

    for path in (inventory_path, csv_path, sbom_path, summary_path):
        if not path.exists():
            raise FileNotFoundError(path)

    inventory = load_json(inventory_path)
    overrides = load_overrides(args.overrides)
    applied, components = apply_to_inventory(inventory, overrides)
    write_inventory(inventory_path, inventory)
    write_csv(csv_path, components)
    update_sbom(sbom_path, inventory["repository"], inventory["pinned_revision"], components)
    write_summary(summary_path, inventory, components, applied)

    print(
        f"Applied {applied} evidence-backed overrides; "
        f"{inventory['unknown_license_count']} unresolved component(s) remain"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
