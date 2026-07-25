# Platform Replication

Canonical research and engineering workspace for evaluating, reconstructing, and selectively adopting open-source platform components into independent Amarax and Daycostra products.

This repository is not a mirror of any third-party company. It stores evidence, license findings, architecture maps, disposition decisions, clean-room plans, and implementation work packages.

## Current program

The first program maps public repositories across the Block ecosystem and related organizations into a governed repository matrix.

Every candidate receives one decision:

- **ADOPT** — consume upstream with minimal change.
- **FORK** — maintain a governed derivative with preserved notices.
- **REFERENCE** — study behavior or architecture, but reimplement independently.
- **REJECT** — do not use because of license, dependency, security, maturity, or product-fit concerns.

## Repository map

- `docs/` — canonical scope, method, workstreams, roadmap, and target architecture.
- `catalog/` — organization and repository inventory.
- `schemas/` — machine-readable assessment contracts.
- `templates/` — repeatable audit templates.
- `decisions/` — architecture and adoption decisions.
- `skills/` — reusable agent procedures.
- `research/` — evidence gathered per organization and repository.
- `workstreams/` — execution packages after a decision is approved.

## Non-negotiable rule

Publicly visible source is not automatically reusable. No source enters an Amarax or Daycostra product before license, attribution, dependency, security, self-hostability, and maintainability gates have passed.
