# Dependency Evidence Results — Wave 1

**Date:** 2026-07-25  
**Workflow:** `Upstream SBOM Evidence`

## Purpose

Move repository assessments beyond top-level license checks by materializing the exact pinned dependency environments, extracting package metadata, generating CycloneDX SBOMs, resolving incomplete metadata through primary-source evidence, and persisting the results in the repository.

This stage establishes dependency visibility. It does not by itself approve distribution.

## Stored evidence

```text
evidence/dependencies/
├── PROVENANCE.json
├── agent-task-queue/
│   ├── SUMMARY.md
│   ├── dependency-inventory.json
│   ├── licenses.csv
│   └── sbom.cdx.json
└── ai-rules/
    ├── SUMMARY.md
    ├── dependency-inventory.json
    ├── licenses.csv
    └── sbom.cdx.json
```

Raw Cargo metadata is retained as a workflow artifact but deliberately excluded from the repository because the normalized inventory and CycloneDX documents contain the durable assessment surface.

## block/agent-task-queue

Pinned revision: `ccb94ae25c2b286d62e7371fd4c0f7ce60e33efa`

| Measure | Result |
|---|---:|
| Python components in the all-extras environment | 74 |
| Initial incomplete or non-normalized license values | 6 |
| Evidence-backed version-specific corrections | 6 |
| Remaining unresolved normalized license fields | 0 |

### Corrected metadata

| Package | Version | Resolved expression | Reason |
|---|---:|---|---|
| beartype | 0.22.9 | MIT | Wheel metadata contained full license text rather than an identifier |
| exceptiongroup | 1.3.1 | MIT AND PSF-2.0 | MIT package plus required PSF notice for copied standard-library portions |
| jaraco.classes | 3.4.0 | MIT | Canonical project metadata declares MIT |
| markdown-it-py | 4.2.0 | MIT | Canonical repository LICENSE is MIT |
| mdurl | 0.1.2 | MIT | Canonical license contains MIT-style grants and retained Joyent notice |
| uncalled-for | 0.3.2 | MIT | Wheel metadata contained full license text rather than an identifier |

The override registry is `compliance/license-overrides.json`. Every entry is pinned to ecosystem, package and version and contains primary-source evidence.

### Remaining review

- FastMCP and package license files;
- package notices and copyright attribution;
- Compose desktop-sidecar dependency graph;
- vendored content and generated code;
- assets and build scripts;
- patent or trademark considerations;
- the exact components included in a future binary or service distribution.

## block/ai-rules

Pinned revision: `b2c1cd16d05f47053eb3f059f87524f7b6ee1a1f`

| Measure | Result |
|---|---:|
| Cargo components from locked metadata | 110 |
| Evidence overrides required | 0 |
| Remaining unresolved normalized license fields | 0 |

The dominant expression is `MIT OR Apache-2.0`. Additional expressions include combinations with Unicode-3.0, BSL-1.0, LLVM exception, Unlicense and an optional LGPL-2.1-or-later branch.

No missing metadata was found, but final distribution still requires:

- selecting permissible license options consistently;
- retaining required license and notice files;
- reviewing installer and binary-release provenance;
- reviewing non-package assets and generated outputs;
- matching the inventory to the actual wrapper or binary that Amarax distributes.

## Automation

`tools/generate_upstream_sbom.py` creates package inventories, CSV reports and CycloneDX 1.5 documents from installed Python environments and locked Cargo metadata.

`tools/apply_license_overrides.py` applies only version-pinned overrides with explicit evidence, updates all output formats, and fails the workflow when unresolved license metadata remains for the currently gated repositories.

`.github/workflows/upstream-sbom-evidence.yml`:

1. checks out exact pinned upstream revisions;
2. materializes the dependency environment;
3. generates and normalizes evidence;
4. requires zero unresolved normalized license values;
5. uploads 90-day workflow artifacts;
6. persists normalized evidence on `program/**` branches;
7. writes a provenance manifest.

## Current gate state

| Repository | Metadata discovery | Build | Dependency review | Product import |
|---|---|---|---|---|
| Agent Task Queue | Complete | Passed | Conditional | Blocked |
| AI Rules | Complete | Passed | Conditional | Blocked |

Both remain blocked from product import until security, behavior, notice, asset and distribution-specific gates are complete.