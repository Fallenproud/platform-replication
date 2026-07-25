# Decision 0008 — Guarded Local Task Provider Boundary

## Status

Accepted conditionally on 2026-07-25.

## Decision

Agent Task Queue may be used only behind the Amarax Guarded Task Adapter as a trusted local execution provider.

AIKOV and Orynero retain authority over admission, actor and project context, policy outcome, approvals, workspace scope, executable class, environment references, timeout, audit, and promotion to stronger sandbox providers.

## Provider contract

The adapter accepts structured executable and argument fields rather than caller-supplied shell command text. It validates a real working directory under approved roots and invokes `tq` without a shell in the adapter process.

The upstream `tq` CLI at the pinned revision does not expose its MCP `env_vars` capability. Resolved environment values must therefore be injected into the controlled `tq` process environment rather than serialized into argv or queue command text. Only allowlisted reference names may be resolved, and captured output must be redacted.

## Rationale

This structure preserves the useful local FIFO, timeout, logging, process, and MCP behavior while preventing the upstream provider from becoming the product's authorization boundary.

Pinned integration proved that shell-sensitive characters remain one literal task argument and that resolved environment values reach the task without appearing in adapter results, events, or provider argv.

## Prohibited uses

- unauthenticated remote execution;
- cross-tenant scheduling through one local SQLite database;
- production execution without an approved sandbox provider;
- literal secrets in requests or command arguments;
- executable paths supplied by callers;
- workspace paths outside approved realpath roots;
- policy decisions with missing actor, project, environment, or expiry context;
- treating local queue state as immutable audit evidence.

## Remaining gates

- semantic command policy and approval classes;
- production secret-provider integration;
- nested process-tree cancellation tests against the real provider;
- Compose sidecar review or exclusion;
- Gradle dependency evidence if the sidecar is distributed;
- target AIKOV integration;
- upstream sync and security ownership;
- product-specific license and notice packaging.