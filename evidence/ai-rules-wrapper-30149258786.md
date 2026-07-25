# Amarax AI Rules Wrapper Evidence — Run 30149258786

**Date:** 2026-07-25  
**Workflow:** `AI Rules Wrapper`  
**Runtime:** Node.js 22  
**Result:** success

## Scope

Verify the original Amarax transactional wrapper created around an approved, externally supplied AI Rules binary. The wrapper source does not include or copy upstream AI Rules implementation code.

## Verified controls

- Node syntax validation for the wrapper core and CLI.
- Compiler execution occurs in a disposable staged copy rather than the real repository.
- Dry-run reports staged changes without applying them.
- Only paths declared by `allowedOutputs` may be changed.
- Generated files and relative symlinks are copied from staging into the real repository.
- A product-owned manifest records compiler identity, source digest, output states, and observed operations.
- Verification detects source-rule drift.
- Verification detects generated-output drift.
- Regeneration restores canonical generated content.
- Cleanup removes only manifest-owned outputs and leaves source rules intact.
- MCP environment values must use references such as `${EVIDENCE_REF}` rather than plain values.
- A compiler that writes an undeclared path is rejected before any staged change reaches the real repository.

## Tests

The successful run executed six behavior tests:

1. dry-run isolation;
2. generate, verify, regenerate, and clean lifecycle;
3. source-drift detection;
4. rejection of plain MCP credential values;
5. rejection of undeclared compiler outputs;
6. preservation of the real repository when staging validation fails.

## Test-harness correction

The first CI attempt used Node's broad default test discovery. It also executed the fake compiler fixture as a test module, while all six actual tests passed. The package test script was narrowed to `test/*.test.mjs`, after which the workflow completed successfully.

## Product boundary

The wrapper controls file generation and repository mutation. It does not authorize MCP tools, approve external commands, manage runtime credentials, or replace Orynero policy decisions. Generated instruction files remain configuration inputs, not security policy.

## Remaining gates

- execute the wrapper against the real pinned AI Rules v1.7.0 binary in an isolated integration fixture;
- add nested monorepo scope tests;
- add Windows symlink and fallback tests;
- collect a generated output manifest for every supported Amarax target agent;
- add target-repository integration and CI drift enforcement;
- package notices for the upstream binary if Amarax distributes it rather than requiring a user-provided installation.