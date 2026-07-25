#!/usr/bin/env python3
"""Generate deterministic third-party notices from the approved component registry."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "compliance" / "distributed-components.json"
OUTPUT = ROOT / "generated" / "THIRD_PARTY_NOTICES.md"
REQUIRED = {
    "repository",
    "upstream_ref",
    "license",
    "license_source",
    "copyright",
    "distributed",
    "target_products",
    "modifications",
}


def load_registry() -> list[dict[str, Any]]:
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("components"), list):
        raise ValueError("registry must contain a components array")

    components: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for index, component in enumerate(data["components"]):
        if not isinstance(component, dict):
            raise ValueError(f"component {index} must be an object")
        missing = REQUIRED - component.keys()
        if missing:
            raise ValueError(f"component {index} missing: {', '.join(sorted(missing))}")
        key = (str(component["repository"]), str(component["upstream_ref"]))
        if key in seen:
            raise ValueError(f"duplicate component entry: {key[0]}@{key[1]}")
        seen.add(key)
        if not isinstance(component["distributed"], bool):
            raise ValueError(f"{key[0]}: distributed must be boolean")
        if not isinstance(component["target_products"], list) or not all(
            isinstance(item, str) for item in component["target_products"]
        ):
            raise ValueError(f"{key[0]}: target_products must be an array of strings")
        if component["distributed"] and not component["target_products"]:
            raise ValueError(f"{key[0]}: distributed components require at least one target product")
        components.append(component)
    return components


def render(components: list[dict[str, Any]]) -> str:
    distributed = sorted(
        (component for component in components if component["distributed"]),
        key=lambda item: (item["repository"].lower(), item["upstream_ref"]),
    )

    lines = [
        "# Generated Third-Party Notices",
        "",
        "This file is generated from `compliance/distributed-components.json`.",
        "Do not edit it manually.",
        "",
    ]

    if not distributed:
        lines.extend(
            [
                "No assessed third-party source component is currently marked as distributed by an Amarax or Daycostra product.",
                "Assessment and architecture-reference records do not by themselves imply source distribution.",
                "",
            ]
        )
        return "\n".join(lines)

    for component in distributed:
        products = ", ".join(sorted(component["target_products"]))
        lines.extend(
            [
                f"## {component['repository']}",
                "",
                f"- Upstream revision: `{component['upstream_ref']}`",
                f"- License: {component['license']}",
                f"- License source: {component['license_source']}",
                f"- Target products: {products}",
                f"- Copyright: {component['copyright']}",
                f"- Modifications: {component['modifications']}",
                "",
            ]
        )
    return "\n".join(lines)


def main() -> int:
    try:
        components = load_registry()
        rendered = render(components)
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(rendered, encoding="utf-8")
    except Exception as exc:  # noqa: BLE001 - CLI needs concise deterministic errors
        print(f"notice generation failed: {exc}", file=sys.stderr)
        return 1
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
