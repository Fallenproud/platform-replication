#!/usr/bin/env python3
"""Generate deterministic dependency, license, and CycloneDX evidence.

The tool deliberately uses only Python's standard library. It supports:

- an installed Python environment, queried through its own interpreter;
- Cargo metadata generated with `cargo metadata --locked`.

It creates evidence artifacts. It does not make a legal approval decision.
"""

from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import quote

UNKNOWN_LICENSES = {"", "UNKNOWN", "NOASSERTION", "NONE", "N/A"}


@dataclass(frozen=True)
class Component:
    name: str
    version: str
    ecosystem: str
    license: str
    license_file: str | None
    homepage: str | None
    repository: str | None
    source: str | None
    purl: str
    direct: bool | None


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalize_license(value: str | None) -> str:
    if value is None:
        return "NOASSERTION"
    normalized = " ".join(value.split()).strip()
    return normalized if normalized and normalized.upper() not in UNKNOWN_LICENSES else "NOASSERTION"


def project_urls(message: dict[str, Any]) -> dict[str, str]:
    result: dict[str, str] = {}
    raw = message.get("Project-URL") or []
    if isinstance(raw, str):
        raw = [raw]
    for item in raw:
        if "," not in item:
            continue
        label, url = item.split(",", 1)
        result[label.strip().lower()] = url.strip()
    return result


def query_python_environment(interpreter: Path) -> list[dict[str, Any]]:
    program = r'''
import importlib.metadata as metadata
import json

rows = []
for dist in metadata.distributions():
    message = dist.metadata
    rows.append({
        "name": message.get("Name") or dist.name,
        "version": dist.version,
        "license_expression": message.get("License-Expression"),
        "license": message.get("License"),
        "license_files": list(message.get_all("License-File") or []),
        "home_page": message.get("Home-page"),
        "project_urls": list(message.get_all("Project-URL") or []),
        "requires": list(dist.requires or []),
    })
print(json.dumps(rows, sort_keys=True))
'''
    completed = subprocess.run(
        [str(interpreter), "-c", program],
        check=True,
        capture_output=True,
        text=True,
    )
    data = json.loads(completed.stdout)
    if not isinstance(data, list):
        raise ValueError("Python environment query did not return a list")
    return data


def python_components(interpreter: Path) -> list[Component]:
    components: list[Component] = []
    for item in query_python_environment(interpreter):
        urls: dict[str, str] = {}
        for raw in item.get("project_urls", []):
            if "," in raw:
                label, url = raw.split(",", 1)
                urls[label.strip().lower()] = url.strip()
        name = str(item["name"])
        version = str(item["version"])
        license_value = normalize_license(item.get("license_expression") or item.get("license"))
        license_files = item.get("license_files") or []
        repository = (
            urls.get("source")
            or urls.get("repository")
            or urls.get("source code")
            or urls.get("code")
        )
        homepage = item.get("home_page") or urls.get("homepage") or urls.get("documentation")
        components.append(
            Component(
                name=name,
                version=version,
                ecosystem="pypi",
                license=license_value,
                license_file="; ".join(license_files) if license_files else None,
                homepage=homepage,
                repository=repository,
                source=None,
                purl=f"pkg:pypi/{quote(name.lower(), safe='._-')}@{quote(version, safe='._-+')}",
                direct=None,
            )
        )
    return sorted(components, key=lambda component: (component.name.lower(), component.version))


def cargo_components(metadata_path: Path) -> list[Component]:
    payload = json.loads(metadata_path.read_text(encoding="utf-8"))
    workspace_members = set(payload.get("workspace_members", []))
    components: list[Component] = []
    for package in payload.get("packages", []):
        name = str(package["name"])
        version = str(package["version"])
        source = package.get("source")
        components.append(
            Component(
                name=name,
                version=version,
                ecosystem="cargo",
                license=normalize_license(package.get("license")),
                license_file=package.get("license_file"),
                homepage=package.get("homepage"),
                repository=package.get("repository"),
                source=source,
                purl=f"pkg:cargo/{quote(name, safe='._-')}@{quote(version, safe='._-+')}",
                direct=package.get("id") in workspace_members,
            )
        )
    return sorted(components, key=lambda component: (component.name.lower(), component.version))


def cyclonedx(repository: str, revision: str, components: Iterable[Component]) -> dict[str, Any]:
    component_rows = []
    for component in components:
        row: dict[str, Any] = {
            "type": "library",
            "name": component.name,
            "version": component.version,
            "purl": component.purl,
            "licenses": [{"license": {"name": component.license}}],
            "properties": [
                {"name": "amarax:ecosystem", "value": component.ecosystem},
                {"name": "amarax:license-file", "value": component.license_file or ""},
                {"name": "amarax:source", "value": component.source or ""},
                {"name": "amarax:direct", "value": "unknown" if component.direct is None else str(component.direct).lower()},
            ],
        }
        external_references = []
        if component.homepage:
            external_references.append({"type": "website", "url": component.homepage})
        if component.repository:
            external_references.append({"type": "vcs", "url": component.repository})
        if external_references:
            row["externalReferences"] = external_references
        component_rows.append(row)

    return {
        "bomFormat": "CycloneDX",
        "specVersion": "1.5",
        "serialNumber": f"urn:uuid:00000000-0000-0000-0000-{abs(hash((repository, revision))) % 10**12:012d}",
        "version": 1,
        "metadata": {
            "timestamp": utc_now(),
            "tools": [
                {
                    "vendor": "Amarax Platform Replication",
                    "name": "generate_upstream_sbom.py",
                    "version": "1.0.0",
                }
            ],
            "component": {
                "type": "application",
                "name": repository,
                "version": revision,
                "properties": [{"name": "amarax:pinned-revision", "value": revision}],
            },
        },
        "components": component_rows,
    }


def write_outputs(
    out_dir: Path,
    repository: str,
    revision: str,
    mode: str,
    components: list[Component],
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    generated_at = utc_now()
    unknown = [component for component in components if component.license == "NOASSERTION"]

    inventory = {
        "schema_version": 1,
        "repository": repository,
        "pinned_revision": revision,
        "mode": mode,
        "generated_at": generated_at,
        "component_count": len(components),
        "unknown_license_count": len(unknown),
        "components": [asdict(component) for component in components],
    }
    (out_dir / "dependency-inventory.json").write_text(
        json.dumps(inventory, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    (out_dir / "sbom.cdx.json").write_text(
        json.dumps(cyclonedx(repository, revision, components), indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    with (out_dir / "licenses.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "name",
                "version",
                "ecosystem",
                "license",
                "license_file",
                "homepage",
                "repository",
                "source",
                "purl",
                "direct",
            ],
        )
        writer.writeheader()
        for component in components:
            writer.writerow(asdict(component))

    license_counts: dict[str, int] = {}
    for component in components:
        license_counts[component.license] = license_counts.get(component.license, 0) + 1

    lines = [
        f"# Dependency Evidence — {repository}",
        "",
        f"- Pinned revision: `{revision}`",
        f"- Generation mode: `{mode}`",
        f"- Generated: `{generated_at}`",
        f"- Components: **{len(components)}**",
        f"- Components without normalized license metadata: **{len(unknown)}**",
        "",
        "## License metadata summary",
        "",
        "| License metadata | Components |",
        "|---|---:|",
    ]
    for license_name, count in sorted(license_counts.items(), key=lambda item: (-item[1], item[0])):
        lines.append(f"| {license_name.replace('|', '/')} | {count} |")
    lines.extend(
        [
            "",
            "## Interpretation",
            "",
            "This is automated package metadata, not legal approval. `NOASSERTION`, ambiguous expressions, license files, vendored sources, assets, models, datasets, generated code, build scripts and non-package content require separate review.",
            "",
        ]
    )
    (out_dir / "SUMMARY.md").write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository", required=True)
    parser.add_argument("--revision", required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    subparsers = parser.add_subparsers(dest="mode", required=True)

    python_parser = subparsers.add_parser("python-env")
    python_parser.add_argument("--python", type=Path, required=True)

    cargo_parser = subparsers.add_parser("cargo-metadata")
    cargo_parser.add_argument("--metadata", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.mode == "python-env":
        components = python_components(args.python)
    elif args.mode == "cargo-metadata":
        components = cargo_components(args.metadata)
    else:
        raise AssertionError(args.mode)

    if not components:
        raise RuntimeError("No dependency components were discovered")
    write_outputs(args.out_dir, args.repository, args.revision, args.mode, components)
    print(f"Generated {len(components)} components in {args.out_dir}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
