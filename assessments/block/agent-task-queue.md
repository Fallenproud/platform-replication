# Repository Assessment — block/agent-task-queue

## Decision

**FORK — conditional, local and guarded execution only.**

The repository is a compact, self-hostable MCP and CLI utility for coordinating expensive commands across multiple local agents. It solves a real AIKOV problem: preventing build, test, container, and package operations from saturating the same workstation.

It is not a production multi-tenant scheduler. Its primary tool intentionally accepts an arbitrary shell command and executes it with the caller's environment and filesystem permissions. Direct adoption into a remote or shared control plane would create a command-execution boundary without sufficient authorization, isolation, tenancy, or secret controls.

## Pinned upstream

- Repository: `block/agent-task-queue`
- Commit: `ccb94ae25c2b286d62e7371fd4c0f7ce60e33efa`
- Version observed: `0.4.1`
- License: Apache-2.0
- Build reproduction: pending

## Capability map

- FastMCP server exposing `run_task`.
- Local `tq` CLI.
- FIFO queues with optional named queues.
- Hierarchical queue scopes and process-local capacity overrides.
- SQLite queue state using WAL and busy timeouts.
- Process and child-process tracking.
- Stale task and zombie-process cleanup.
- Execution timeouts and process-group termination.
- Output retention and task metrics.
- Repository, branch, worktree, working-directory, and agent metadata.
- Compose Multiplatform desktop queue viewer.

## Target mapping

| Upstream capability | Amarax target |
|---|---|
| FIFO and hierarchical queue logic | AIKOV Resource Scheduler |
| MCP `run_task` tool | Guarded Build local executor adapter |
| SQLite occupancy state | Local developer-mode queue provider |
| Task origin metadata | RuntimeEvent and AuditLog correlation |
| Zombie cleanup | Sandbox process supervisor |
| Queue sidecar | Voltino and Threads Monitor task occupancy panel |

## Required architectural boundary

The fork must sit behind an Amarax-owned scheduler contract. Product code must not depend directly on FastMCP models, SQLite tables, output-file paths, or the upstream command result shape.

The product contract must distinguish:

- request admission;
- policy evaluation;
- queue reservation;
- execution sandbox;
- streaming output;
- cancellation and timeout;
- terminal result;
- immutable audit evidence.

## Security findings

The strongest feature is also the largest risk: `run_task` calls an operating-system shell with caller-provided command text. Shell operators, redirects, environment variables, package scripts, Docker, Kubernetes, and arbitrary local executables are all intentionally available.

Before product integration, the fork requires:

1. actor, organization, project, environment, and agent identity;
2. command classification and policy evaluation;
3. path and workspace scoping;
4. environment allowlisting and secret redaction;
5. sandbox and resource quotas;
6. approval requirements for destructive or privileged commands;
7. event streaming and immutable audit records;
8. distributed queue authority when coordinating more than one machine;
9. explicit retention for logs and command output.

## Import gates

- Reproduce Python package and test suite at the pinned commit.
- Reproduce the `tq` CLI.
- Reproduce or deliberately exclude the desktop sidecar.
- Generate Python and Gradle dependency inventories.
- Review FastMCP, desktop dependencies, assets, and all distributed notices.
- Create a minimal patch queue containing only Amarax-specific boundaries and controls.
- Add upstream sync automation and security-update ownership.

## Final position

This is a strong small-system candidate for a governed fork. It should become the local execution provider beneath AIKOV Guarded Build, not the authoritative scheduler or policy engine by itself.