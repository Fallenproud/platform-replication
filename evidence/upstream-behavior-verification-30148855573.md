# Upstream Behavior Verification Evidence — Run 30148855573

**Date:** 2026-07-25  
**Workflow:** `Upstream Behavior Verification`  
**Result:** success

## Purpose

Verify observable runtime behavior at the exact pinned revisions after build and dependency evidence had passed. These tests exercise disposable local fixtures only. They do not approve production exposure, multi-tenant operation, privileged command execution, source distribution, or final product import.

## block/agent-task-queue

Pinned revision: `ccb94ae25c2b286d62e7371fd4c0f7ce60e33efa`

The Linux/Python 3.13 job passed:

- `tq --help` and CLI discovery;
- empty-state `list --json` contract;
- safe command execution in an isolated working directory;
- creation and retrieval of task events;
- presence of `task_queued`, `task_started`, and `task_completed` log events;
- deterministic FIFO serialization after waiting for an explicit first-task-start signal;
- execution timeout and expected exit code `124`;
- in-memory FastMCP transport;
- discovery of `run_task` and `clear_task_logs` tools;
- successful non-shell MCP call to `clear_task_logs`.

### Test-harness correction

An earlier attempt submitted two background `uv run tq` processes after a fixed 200 ms delay. On one runner, process startup ordering inverted before either command registered with the queue. That tested shell-launch timing rather than queue FIFO behavior.

The final test waits until task one has actually started and written an explicit marker before submitting task two. The resulting execution order passed. This correction is a test determinism fix, not an upstream queue patch.

### Remaining behavior gates

- remote or multi-process MCP transport under authenticated supervision;
- policy-denied commands;
- environment and secret filtering;
- workspace boundary enforcement;
- cancellation during active execution;
- process-tree termination under nested child processes;
- desktop-sidecar behavior;
- distributed scheduling beyond one SQLite authority.

## block/ai-rules

Pinned revision: `b2c1cd16d05f47053eb3f059f87524f7b6ee1a1f`

The Linux/Rust job passed:

- release binary startup and version output;
- supported-agent inventory;
- repository initialization;
- standard rule generation;
- generated shared rule aggregation;
- Claude `CLAUDE.md` and `.mcp.json` output;
- Codex `AGENTS.md` and `.codex/config.toml` output;
- Cursor shared `AGENTS.md` and `.cursor/mcp.json` output;
- generated content verification;
- status reporting;
- deliberate generated-target drift;
- regeneration that removed drift and restored canonical content;
- cleanup of generated files and symlinks;
- symlink mode for Claude and Codex.

### Documentation drift discovered

`docs/agents.md` describes Cursor standard-mode rules as `.cursor/rules/*.mdc`. The pinned v1.7.0 generator instead reported and produced a shared root `AGENTS.md`, alongside `.cursor/mcp.json`.

The first verification failed because it asserted the documented `.cursor/rules` directory. A diagnostic artifact captured the actual generated tree. The final verification follows the pinned binary's observable manifest and records the documentation mismatch as a wrapper-maintenance requirement.

### Remaining behavior gates

- nested monorepo scopes;
- Windows symlink and fallback behavior;
- cleanup safety outside disposable fixtures;
- secret-reference validation in MCP configurations;
- allowed-output-root enforcement through the Amarax wrapper;
- exact drift semantics for partially selected agent sets;
- installer and prebuilt-binary provenance.

## Interpretation

The behavior results strengthen the current dispositions:

| Repository | Disposition | Behavior status |
|---|---|---|
| `block/agent-task-queue` | FORK, conditional | Core CLI, FIFO, timeout, logs and MCP surface reproduced |
| `block/ai-rules` | ADOPT, conditional | Core initialization, generation, status, regeneration, cleanup and symlink behavior reproduced |

Neither repository is approved for product import yet. Security controls, notices, assets, non-package content, wrappers, product-specific integration tests, and actual distribution manifests remain required.