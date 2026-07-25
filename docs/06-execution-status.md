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
- reproduced dependency installation, Ruff and upstream tests successfully on Python 3.10 and Python 3.13;
- generated and persisted a 74-component Python dependency inventory and CycloneDX SBOM;
- resolved six incomplete or non-normalized package license values with version-pinned primary-source evidence, leaving zero unresolved normalized fields;
- accepted a conditional FORK decision for trusted local execution behind AIKOV policy and sandbox contracts;
- pinned `block/ai-rules` to `b2c1cd16d05f47053eb3f059f87524f7b6ee1a1f`;
- verified Apache-2.0 and mapped multi-agent rules, commands, skills, MCP configuration, nested scopes and drift checks;
- reproduced format, Clippy, tests and release build successfully;
- generated and persisted a 110-component locked Cargo inventory and CycloneDX SBOM with zero unresolved normalized license fields;
- accepted a conditional ADOPT decision as repository tooling rather than runtime policy;
- pinned `block/xcode-index-mcp` to `c89af82aee64c42690a60c2dda6d9e0f8bf022e9`;
- corrected the initial license lookup after CI found Apache-2.0 in `LICENSE.txt`;
- reproduced Python 3.13 installation and compilation plus Swift build and tests successfully on macOS 15;
- superseded Decision 0006 and accepted Decision 0007 for a conditional optional FORK;
- created product-owned scheduler, instruction compiler and semantic code-index contracts.

**State:** Issue #4 is closed. Agent Task Queue and AI Rules have completed architecture, license, build and package-metadata discovery. Their dependency reviews remain `conditional` until license files, notices, non-package content, security behavior and actual distribution composition are approved.

### Issue #6 — compliance pipeline

- added a dependency-free assessment validator;
- added a deterministic third-party notice generator;
- added a distribution registry that distinguishes assessment from actual source distribution;
- added a generated notice baseline;
- added GitHub Actions enforcement;
- added pinned upstream build-verification CI;
- completed compliance run `30147827095` successfully;
- completed upstream build-verification run `30147827108` successfully;
- added language-neutral Python and Cargo dependency inventory generation;
- added CycloneDX 1.5 generation;
- added a version-pinned evidence-backed license override registry;
- added a normalizer that updates inventory, CSV, SBOM and summary outputs;
- required zero unresolved normalized package license fields for the currently gated repositories;
- persisted normalized evidence and provenance under `evidence/dependencies/`.

**State:** package-metadata SBOM ingestion is operational for Python and Cargo. Asset detection, license-file collection, notice composition, Java/Gradle sidecar inventory and product-specific distribution manifests remain open.

### Isolated prototypes

- `prototypes/goose-runtime-adapter` defines the stable product-owned runtime boundary;
- `prototypes/thread-monitor-adapter` defines a provider-neutral session ingestion boundary;
- `prototypes/agent-control-plane-adapters` defines scheduler, instruction compiler and semantic code-index boundaries;
- none of the prototypes copy third-party source.

## Current decisions

| Repository | Decision | Build evidence | Dependency evidence | Meaning |
|---|---|---|---|---|
| `aaif-goose/goose` | FORK, conditional | Pending | Pending | Maintain an isolated upstream-tracked runtime distribution after gates pass |
| `block/thread-manager-for-amp` | REFERENCE | Pending | Pending | Reconstruct behavior against Daycostra contracts; assess individual component reuse separately |
| `block/agent-task-queue` | FORK, conditional | Passed: Python 3.10 and 3.13 | 74 components; 0 unresolved; conditional | Use as a guarded trusted-local execution provider after policy, sandbox and provenance gates pass |
| `block/ai-rules` | ADOPT, conditional | Passed: fmt, Clippy, tests and release | 110 components; 0 unresolved; conditional | Consume through a pinned wrapper as repository instruction tooling, not runtime authorization |
| `block/xcode-index-mcp` | FORK, conditional | Passed: Python and Swift on macOS 15 | Pending | Maintain an optional Voltino macOS semantic-index provider after dependency and transport gates pass |

## Correction record

The first Xcode Index MCP assessment searched for `LICENSE` and missed the tracked `LICENSE.txt`. CI exposed the mistake. Decision 0006 is retained as superseded, and Decision 0007 records the corrected Apache-2.0 fork decision.

## Evidence

- Build verification: `evidence/upstream-build-verification-30147827108.md`
- Dependency results: `docs/08-dependency-evidence-results.md`
- Persisted inventories: `evidence/dependencies/`
- Override registry: `compliance/license-overrides.json`

## Next executable queue

1. Generate and review the Agent Task Queue Compose/Gradle sidecar inventory.
2. Perform explicit Agent Task Queue CLI and MCP smoke tests under restricted working-directory and environment policies.
3. Review package license files and generate candidate notices for Agent Task Queue and AI Rules without marking them distributed.
4. Test AI Rules generation, cleanup, nested scopes, symlinks, MCP outputs and Windows behavior through the product wrapper.
5. Pin and review Xcode Index MCP's IndexStoreDB and full Python/Swift dependency graph.
6. Run a disposable Xcode DerivedData integration test and design authenticated transport.
7. Reproduce Goose CLI/server/desktop builds and generate Cargo and pnpm SBOMs.
8. Reproduce Thread Manager build and test the documented localhost boundary.
9. Audit `block/ftl`, `block/elasticgraph` and `block/buzz` as high-value second-wave candidates.
10. Promote approved adapters into target repositories only after import gates pass.

## Program boundary

No third-party source has been imported or marked as distributed. The repository contains evidence, decisions, compliance tooling and original adapter contracts only.