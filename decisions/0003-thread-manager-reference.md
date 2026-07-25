# Decision 0003 — Use Thread Manager for Amp as a reference

- **Status:** Accepted
- **Date:** 2026-07-25
- **Repository:** `block/thread-manager-for-amp`
- **Pinned assessment ref:** `126cf2234a13a08a93d0d4cbd758a8fc77301d78`
- **Disposition:** REFERENCE

## Context

Thread Manager for Amp offers a strong local UX for multiple agent threads, terminal sessions, handoffs, thread relationships, search, git correlation, skills, MCP status, artifacts and Workboard-style organization.

Its authority and security model are tied to Amp and to a trusted single-user machine. It reads Amp credentials and data files, uses an Amp internal API client, stores local metadata in SQLite, exposes local PTYs and intentionally provides no API or WebSocket authentication.

## Decision

Use the repository as an architecture, interaction and selective component-extraction reference. Do not fork it as the Daycostra production session runtime or control plane.

Daycostra will reconstruct the valuable behavior against its own authenticated, organization- and project-scoped contracts. Any source-level component reuse requires a separate component assessment and preserved Apache-2.0 notices.

## Required replacement layers

- canonical Session, SessionGoal, Checkpoint, Branch and Workboard entities;
- authenticated HTTP and event-stream contracts;
- organization, project, role and ownership scoping;
- Orynero policy decisions and approval gates;
- AuditLog and RuntimeEvent emission;
- managed artifacts and retention;
- sandboxed terminal/execution providers;
- explicit provider adapters, including any future Amp adapter.

## Consequences

### Positive

- captures a mature interaction model without inheriting Amp as domain authority;
- reduces multi-tenant and security migration risk;
- aligns with the existing Daycostra Threads Monitor specification;
- permits isolated reuse of genuinely generic modules after review.

### Negative

- requires reimplementation of backend contracts and persistence;
- cannot use the upstream application as a production shortcut;
- generic and Amp-specific code must be separated carefully.

## Revisit trigger

Revisit only if upstream introduces a provider-neutral authenticated server and documented stable protocol that removes the current Amp and localhost assumptions.
