# Upstream Build Verification Evidence — Run 30147827108

**Date:** 2026-07-25  
**Workflow:** `Upstream Build Verification`  
**Result:** success  
**Trigger commit:** `83089540d322612ee06c7d49c83034dc31448e82`

## Purpose

Verify that the exact pinned upstream revisions recorded in the repository assessments can be fetched and built or tested in isolated GitHub-hosted environments. This evidence establishes technical reproducibility only. It does not approve product import, distribution, security posture, transitive licenses, assets, or operational readiness.

## Verified repositories

### block/agent-task-queue

Pinned revision: `ccb94ae25c2b286d62e7371fd4c0f7ce60e33efa`

Passed on Python 3.10:

- pinned checkout verification;
- dependency installation with `uv sync --all-extras`;
- Ruff validation;
- complete upstream pytest suite.

Passed on Python 3.13:

- pinned checkout verification;
- dependency installation with `uv sync --all-extras`;
- Ruff validation;
- complete upstream pytest suite.

Build reproduction status is therefore recorded as `true`. Desktop-sidecar reproduction, explicit CLI/MCP smoke tests, dependency SBOM, security controls and product integration remain open.

### block/ai-rules

Pinned revision: `b2c1cd16d05f47053eb3f059f87524f7b6ee1a1f`

Passed on Ubuntu:

- pinned checkout verification;
- Apache-2.0 evidence verification;
- `cargo fmt --check`;
- upstream Clippy check;
- complete Rust test suite;
- release build.

Build reproduction status is therefore recorded as `true`. Installer provenance, Cargo SBOM, behavior tests, Windows symlink behavior and the Amarax wrapper remain open.

### block/xcode-index-mcp

Pinned revision: `c89af82aee64c42690a60c2dda6d9e0f8bf022e9`

Passed license evidence on Ubuntu:

- pinned checkout verification;
- root `LICENSE.txt` present and tracked;
- Apache License text verified.

Passed on macOS 15:

- Python 3.13 installation;
- Python dependency synchronization;
- Python package compilation;
- Swift service build;
- Swift test suite.

Build reproduction status is therefore recorded as `true`. A live disposable Xcode DerivedData integration test, IndexStoreDB pinning, Python and Swift SBOMs, transport hardening and Voltino adapter tests remain open.

## Other program verification

The associated Platform Replication Compliance workflow run `30147827095` also completed successfully. It validated machine-readable assessments and verified generated third-party notice state.

## Interpretation

These successes materially strengthen the dispositions:

- Agent Task Queue remains a conditional `FORK` candidate.
- AI Rules remains a conditional `ADOPT` candidate.
- Xcode Index MCP remains a conditional optional `FORK` candidate.

No third-party source is marked as distributed, and no import gate is automatically approved merely because the source builds.