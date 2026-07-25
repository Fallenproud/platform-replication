# Decision 0006 — Xcode Index MCP as Clean-Room Reference

## Status

**Superseded by Decision 0007 on 2026-07-25.**

## Original decision

Use `block/xcode-index-mcp` only as evidence of an observable two-process semantic-index architecture because the initial review did not find an explicit source license.

## Why this decision was superseded

The initial check looked for a root file named `LICENSE` and inspected `pyproject.toml`. A subsequent CI job enumerated the repository tree and found a tracked root file named `LICENSE.txt`. That file contains Apache License 2.0.

The original legal premise was therefore incorrect. The architecture and security concerns remain valid, but source reuse is not prohibited by a missing license.

## Preserved findings

- Voltino should own a language-neutral `CodeIndexProvider` contract.
- The upstream implementation is coupled to macOS, Xcode DerivedData and Swift IndexStoreDB.
- The fixed localhost port and missing explicit transport authentication require replacement.
- IndexStoreDB must be pinned rather than consumed from an unbounded branch.
- Goose-specific paths and assumptions must be removed.

## Superseding decision

Decision 0007 changes the disposition from `REFERENCE` to a conditional, narrow, optional `FORK` after confirming Apache-2.0 license evidence.