# Decision 0005 — Adopt AI Rules as Repository Tooling

## Status

Accepted conditionally on 2026-07-25.

## Decision

Adopt `block/ai-rules` through a pinned wrapper as the default compiler and synchronization utility for repository-level agent instructions, commands, skills and MCP configuration.

Do not fork unless future product requirements cannot be expressed through upstream configuration or a thin wrapper.

## Rationale

The tool is independent, self-hostable, Apache-2.0 licensed, technically aligned with Amarax's multi-agent repository workflow, and inexpensive to replace. Upstream consumption minimizes maintenance while providing one source for many agent-specific output formats.

## Product boundary

AI Rules is a file compiler and drift checker. It is not:

- an authorization system;
- a runtime policy engine;
- a secrets manager;
- an agent orchestrator;
- an execution sandbox;
- a substitute for Orynero or AIKOV controls.

## Required wrapper behavior

- pin version or commit;
- constrain input and output roots;
- support dry-run and diff inspection;
- reject literal secrets;
- expose deterministic generation in CI;
- record the source rule set and compiler version;
- fail when generated output drifts.

## Merge gates

Build and test reproduction, Cargo dependency review, installer and release provenance, symlink behavior, Windows behavior, cleanup safety, and notice generation must pass before organization-wide rollout.