# Wave 2 Audit Results — Agent Control Plane Tooling

**Date:** 2026-07-25  
**Issue:** #4

## Scope

This wave assessed three independent repositories rather than assigning one bundled decision:

- `block/agent-task-queue`;
- `block/ai-rules`;
- `block/xcode-index-mcp`.

## Results

| Repository | Pinned commit | License | Decision | Target |
|---|---|---|---|---|
| `block/agent-task-queue` | `ccb94ae25c2b286d62e7371fd4c0f7ce60e33efa` | Apache-2.0 | FORK, conditional | AIKOV Guarded Build and Resource Scheduler |
| `block/ai-rules` | `b2c1cd16d05f47053eb3f059f87524f7b6ee1a1f` | Apache-2.0 | ADOPT, conditional | Repository instruction, skill and MCP config compiler |
| `block/xcode-index-mcp` | `c89af82aee64c42690a60c2dda6d9e0f8bf022e9` | Missing / NOASSERTION | REFERENCE | Voltino semantic code-index provider |

## Combined topology

The three systems do not form one runtime. Their correct placement is sequential and governed:

`Canonical repository rules → InstructionCompilerProvider → agent-specific rules and approved MCP references`

`Agent plan → Orynero policy and approval → TaskSchedulerProvider → sandbox provider → execution evidence`

`Agent code-navigation query → CodeIndexProvider → platform-specific semantic index → normalized symbol evidence`

## Key findings

### Agent Task Queue

The upstream queue is compact and genuinely useful. It supports local MCP and CLI execution, FIFO and hierarchical queues, SQLite coordination, process cleanup, timeouts, logs and a sidecar. Its `run_task` tool intentionally executes arbitrary shell commands, so it cannot become a remote or multi-tenant executor without a product-owned policy and sandbox layer.

### AI Rules

AI Rules has excellent fit for the multi-agent repository workflow. It generates rules, commands, skills and MCP configuration for many coding agents from one source. It should be consumed through a pinned wrapper and CI drift check. It is not an authorization or runtime policy engine.

### Xcode Index MCP

The two-process Python plus Swift architecture is useful as a reference for exposing Xcode's IndexStoreDB through MCP. Source reuse is blocked because no explicit source license was found. Voltino should implement a clean-room language-neutral code-index contract and an optional macOS provider.

## Original adapter package

`prototypes/agent-control-plane-adapters` now defines three product-owned contracts:

- `TaskSchedulerProvider`;
- `InstructionCompilerProvider`;
- `CodeIndexProvider`.

No third-party source has been copied.

## Remaining gates

- Reproduce Agent Task Queue package, tests, CLI and optional desktop sidecar.
- Generate Python and Gradle dependency and license inventories.
- Design command policy, sandbox, secret and distributed-queue boundaries.
- Reproduce AI Rules build and test suite.
- Test generation, clean, nested scopes, symlinks, MCP files and Windows behavior.
- Generate Cargo dependency and license inventory.
- Keep Xcode Index MCP source excluded unless an explicit compatible license is added.
- Design and test an independent Voltino Xcode index provider.