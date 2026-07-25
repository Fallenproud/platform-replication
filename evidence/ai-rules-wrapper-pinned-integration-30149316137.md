# Pinned AI Rules Wrapper Integration — Run 30149316137

**Date:** 2026-07-25  
**Workflow:** `AI Rules Wrapper`  
**Integration:** `block/ai-rules@b2c1cd16d05f47053eb3f059f87524f7b6ee1a1f`  
**Result:** success

## Purpose

Verify that the original Amarax transactional wrapper works against the actual pinned AI Rules v1.7.0 source and binary rather than only against a controlled compiler fixture.

## Successful sequence

1. Checked out the exact upstream commit.
2. Built the upstream Rust release binary through its Hermit-managed toolchain.
3. Created a disposable repository and ran upstream initialization.
4. Added an Amarax rule source and MCP configuration containing environment references rather than plain credentials.
5. Ran wrapper dry-run and confirmed that no generated output or manifest reached the real fixture.
6. Ran transactional generation in staging.
7. Applied only allowlisted outputs to the real fixture.
8. Verified the product-owned manifest and source/output digests.
9. Confirmed actual Claude, Codex and Cursor outputs, including the observed shared root `AGENTS.md` behavior.
10. Modified the generated target deliberately and confirmed verification failed.
11. Regenerated and confirmed canonical content and manifest verification were restored.
12. Cleaned manifest-owned outputs and confirmed source rules remained intact.

## Controls exercised

- exact upstream revision verification;
- staging-copy isolation;
- output-path allowlist;
- generated relative symlink handling;
- MCP environment-reference validation;
- source digest generation;
- output digest and symlink target manifesting;
- drift rejection;
- canonical regeneration;
- manifest-owned cleanup.

## Current status

The AI Rules wrapper is validated on Linux with Node.js 22 against the exact pinned AI Rules v1.7.0 binary.

## Remaining promotion gates

- Windows symlink and generated-file fallback behavior;
- nested monorepo output scopes;
- commands and skills propagation;
- target-repository rollout and CI drift enforcement;
- binary acquisition and provenance strategy;
- upstream notice packaging when Amarax distributes the binary;
- final security review of allowed output sets per target repository.