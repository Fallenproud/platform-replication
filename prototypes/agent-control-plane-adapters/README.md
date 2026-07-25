# Agent Control Plane Adapter Boundaries

This prototype defines product-owned contracts after the independent audits of:

- `block/agent-task-queue`;
- `block/ai-rules`;
- `block/xcode-index-mcp`.

No third-party source is copied into this directory.

## Why one boundary package

The three candidates solve different layers:

1. task admission and local command scheduling;
2. repository instruction and MCP configuration compilation;
3. platform-specific semantic code indexing.

They must not be merged into one runtime. They share only identity, project context, provenance, capability reporting and policy integration.

## Product ownership

- **AIKOV** owns task admission, coordination and execution lifecycle.
- **Orynero** owns permission and approval decisions.
- **Sophie-X** owns planning and agent delegation.
- **Voltino** owns developer workspace and code-index consumption.
- **Repository tooling** owns deterministic agent-instruction generation.

## Provider contracts

### TaskSchedulerProvider

A trusted execution provider may implement local FIFO queues, a distributed queue, container jobs or remote sandboxes. The contract separates request admission from command execution and requires actor, project, environment, policy and audit context.

### InstructionCompilerProvider

Compiles canonical project rules, skills and approved MCP references into agent-specific repository artifacts. It does not authorize runtime actions.

### CodeIndexProvider

Normalizes symbol, definition, reference and call-site queries across Xcode IndexStoreDB, language servers, TypeScript services or other index backends.

## Import rule

A provider can be registered only after its repository assessment and disposition permit the intended use. A provider marked `REFERENCE` must be implemented independently.