# Platform Replication

Canonical research and engineering workspace for evaluating, reconstructing, and selectively adopting open-source platform components into independent Amarax and Daycostra products.

This repository is not a mirror of any third-party company. It stores evidence, license findings, architecture maps, disposition decisions, clean-room plans, compliance automation, isolated adapter contracts and implementation work packages.

## Current program

The first program maps public repositories across the Block ecosystem and related organizations into a governed repository matrix.

Every candidate receives one decision:

- **ADOPT** — consume upstream with minimal change.
- **FORK** — maintain a governed derivative with preserved notices.
- **REFERENCE** — study behavior or architecture, but reimplement independently.
- **REJECT** — do not use because of license, dependency, security, maturity, or product-fit concerns.

## Current execution state

- First-wave organization and repository inventory is recorded under `catalog/`.
- `aaif-goose/goose` has a conditional **FORK** decision.
- `block/thread-manager-for-amp` has a **REFERENCE** decision.
- Assessment validation and third-party notice generation run through GitHub Actions.
- Provider-neutral Goose and thread/session adapter prototypes exist without copied upstream source.

See `docs/06-execution-status.md` for completed work, open gates and the next executable queue.

## Repository map

- `docs/` — canonical scope, method, workstreams, roadmap, target architecture and execution status.
- `catalog/` — organization and repository inventory.
- `assessments/` — evidence-backed human and machine-readable repository audits.
- `schemas/` — machine-readable assessment contracts.
- `templates/` — repeatable audit templates.
- `decisions/` — architecture and adoption decisions.
- `compliance/` — approved/distributed component registry.
- `generated/` — deterministic compliance outputs.
- `tools/` — validation and notice-generation automation.
- `prototypes/` — isolated product-owned contracts and adapters; no unapproved upstream source.
- `skills/` — reusable agent procedures.
- `research/` — evidence gathered per organization and repository.
- `workstreams/` — execution packages after a decision is approved.

## Non-negotiable rule

Publicly visible source is not automatically reusable. No source enters an Amarax or Daycostra product before license, attribution, dependency, security, self-hostability, maintainability and product-boundary gates have passed.
