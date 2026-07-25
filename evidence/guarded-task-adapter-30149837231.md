# Guarded Task Adapter Evidence — Run 30149837231

**Date:** 2026-07-25  
**Workflow:** `Guarded Task Adapter`  
**Runtime:** Node.js 22 with pinned Agent Task Queue Python 3.13 environment  
**Result:** success

## Purpose

Verify the original Amarax admission and execution boundary in front of `block/agent-task-queue@ccb94ae25c2b286d62e7371fd4c0f7ce60e33efa`.

The adapter narrows Agent Task Queue from arbitrary caller-provided command text to a policy-approved request containing a known actor, project, environment, queue, executable, argument array, workspace, environment references, and bounded timeout.

## Unit verification

Seven unit tests passed:

1. missing, denied, and expired policy decisions are rejected;
2. workspace, executable, queue, timeout, and environment boundaries are enforced;
3. dry-run exposes references and structured arguments without revealing resolved values;
4. successful provider execution preserves argv, emits lifecycle events, and redacts resolved values;
5. provider exit code `124` is normalized as `timed_out`;
6. `AbortSignal` cancels a ready provider and records cancellation evidence;
7. an already-aborted request returns without spawning the provider.

## Pinned upstream integration

The integration job:

1. checked out the exact Agent Task Queue commit;
2. materialized its Python 3.13 all-extras environment;
3. verified the pinned `tq` CLI;
4. created a disposable approved workspace;
5. executed an original Python fixture through the Guarded Task Adapter and the real `tq` binary;
6. passed a shell-sensitive value, `value;not-shell && still-one-argument`, as one explicit argument;
7. confirmed the fixture received that exact argument rather than executing its metacharacters;
8. resolved `DEMO_OUTPUT` from approved reference `DEMO_REF`;
9. confirmed the target process received the resolved value;
10. confirmed adapter results and lifecycle events contained only `[REDACTED]` rather than the resolved value;
11. confirmed a denied policy stopped before any task result was produced;
12. confirmed dry-run performed admission without executing the provider.

## Upstream interface finding

The Agent Task Queue MCP surface accepts environment variables, but the `tq` CLI at the pinned revision does not provide an `-e` option.

The adapter therefore does not serialize resolved values into provider arguments. It injects only approved output environment names and resolved values into the `tq` process environment. The queued child command inherits those values normally.

This avoids placing resolved values in:

- adapter output;
- provider argv;
- shell command text;
- queue command storage;
- ordinary process-list argument inspection.

Captured stdout and stderr are still redacted because an allowed task may print its environment.

## Test-harness corrections

Two deterministic fixture corrections were required:

- Programmatic test config now compiles the same queue regex that file-based `loadConfig()` creates.
- Cancellation waits for an explicit provider-ready output before aborting, ensuring the test measures controlled cancellation rather than signal timing during process startup.

Neither correction changed the security result or upstream provider behavior.

## Product boundary

The verified adapter provides:

- policy admission;
- actor and project correlation;
- executable allowlisting;
- realpath workspace boundaries;
- named environment-reference resolution;
- argv-preserving provider execution;
- result and event redaction;
- timeout normalization;
- cancellation evidence.

It does not yet provide:

- container or VM isolation;
- distributed queue authority;
- operating-system user separation;
- complete child-process-tree termination proof through the real provider;
- command-specific semantic policy;
- production secret-provider integration;
- remote multi-tenant execution.

## Disposition impact

The evidence strengthens the conditional `FORK` decision for Agent Task Queue. The upstream provider is suitable as a trusted local queue beneath this Amarax-owned boundary, but it remains unsuitable as the authoritative AIKOV scheduler, policy engine, or shared production executor.