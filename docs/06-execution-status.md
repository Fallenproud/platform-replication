# Execution Status

**Program branch:** `program/block-ecosystem-intake`  
**Tracking PR:** `#8`  
**Updated:** 2026-07-25

## Completed in this execution

### Issue #1 — ecosystem inventory

- corrected and expanded the canonical organization map;
- corrected Spiral's observable GitHub organization to `spiralxyz`;
- separated product libraries, developer samples, SDKs, integrations, research and hosted proprietary services;
- expanded the machine-readable catalog from the original seed set to a 51-repository first-wave inventory;
- documented priority candidates and product-boundary warnings.

**State:** first-wave inventory complete; exhaustive pagination, archived-repository classification and per-repository license verification remain open.

### Issue #2 — Goose audit

- pinned `aaif-goose/goose` to `192b5db8b947f91e8a6ceca67b4773dc28ae6169`;
- verified Apache-2.0 at repository/workspace level;
- mapped Rust core, ACP, MCP, providers, recipes, desktop, CLI, secret handling and telemetry;
- produced human and machine-readable assessments;
- accepted a conditional FORK decision;
- created a provider-neutral runtime adapter prototype boundary.

**State:** architecture and disposition complete; reproducible build, dependency inventory, asset review and security testing remain open.

### Issue #3 — Thread Manager audit

- pinned `block/thread-manager-for-amp` to `126cf2234a13a08a93d0d4cbd758a8fc77301d78`;
- verified Apache-2.0;
- mapped frontend, local Node backend, WebSockets, PTYs, SQLite, Amp files, Amp API, git correlation and Workboard behavior;
- recorded the unauthenticated localhost security boundary;
- produced human and machine-readable assessments;
- accepted a REFERENCE decision;
- created a provider-neutral session ingestion prototype boundary.

**State:** architecture and disposition complete; build reproduction and component-level extraction audits remain open.

### Issue #4 — Agent control-plane tooling audits

- pinned `block/agent-task-queue` to `ccb94ae25c2b286d62e7371fd4c0f7ce60e33efa`;
- verified Apache-2.0 and mapped MCP, CLI, SQLite, queue capacity, process supervision, shell execution and sidecar behavior;
- accepted a conditional FORK decision for trusted local execution behind AIKOV policy and sandbox contracts;
- pinned `block/ai-rules` to `b2c1cd16d05f47053eb3f059f87524f7b6ee1a1f`;
- verified Apache-2.0 and mapped multi-agent rules, commands, skills, MCP configuration, nested scopes and drift checks;
- accepted a conditional ADOPT decision as repository tooling rather than runtime policy;
- pinned `block/xcode-index-mcp` to `c89af82aee64c42690a60c2dda6d9e0f8bf022e9`;
- found no explicit source license and accepted a clean-room REFERENCE decision;
- created product-owned scheduler, instruction compiler and semantic code-index contracts.

**State:** architecture, license classification and dispositions complete; build reproduction and dependency inventories remain open for Agent Task Queue and AI Rules. Xcode Index MCP source remains excluded.

### Issue #6 — compliance pipeline

- added a dependency-free assessment validator;
- added a deterministic third-party notice generator;
- added a distribution registry that distinguishes assessment from actual source distribution;
- added a generated notice baseline;
- added GitHub Actions enforcement.

**State:** initial pipeline implemented; dependency SBOM ingestion, asset detection and product-specific notice packaging remain open.

### Isolated prototypes

- `prototypes/goose-runtime-adapter` defines the stable product-owned runtime boundary;
- `prototypes/thread-monitor-adapter` defines a provider-neutral session ingestion boundary;
- `prototypes/agent-control-plane-adapters` defines scheduler, instruction compiler and semantic code-index boundaries;
- none of the prototypes copy third-party source.

## Current decisions

| Repository | Decision | Meaning |
|---|---|---|
| `aaif-goose/goose` | FORK, conditional | Maintain an isolated upstream-tracked runtime distribution after gates pass |
| `block/thread-manager-for-amp` | REFERENCE | Reconstruct behavior against Daycostra contracts; assess individual component reuse separately |
| `block/agent-task-queue` | FORK, conditional | Use as a guarded trusted-local execution provider after policy, sandbox and provenance gates pass |
| `block/ai-rules` | ADOPT, conditional | Consume through a pinned wrapper as repository instruction tooling, not runtime authorization |
| `block/xcode-index-mcp` | REFERENCE | Reimplement independently because no explicit source license was found |

## Next executable queue

1. Run compliance validation for all five machine-readable assessments and generated notices.
2. Reproduce Agent Task Queue package, tests, CLI and desktop sidecar.
3. Generate Python and Gradle SBOM and license inventories for Agent Task Queue.
4. Reproduce AI Rules Rust build and test suite; test generation, cleanup, symlinks, nested scopes and Windows behavior.
5. Generate Cargo SBOM and license inventory for AI Rules.
6. Reproduce Goose CLI/server/desktop builds and generate Cargo and pnpm SBOMs.
7. Reproduce Thread Manager build and test the documented localhost boundary.
8. Audit `block/ftl`, `block/elasticgraph` and `block/buzz` as high-value second-wave candidates.
9. Promote approved adapters into target repositories only after import gates pass.

## Program boundary

No third-party source has been imported or marked as distributed. The repository contains evidence, decisions, compliance tooling and original adapter contracts only.