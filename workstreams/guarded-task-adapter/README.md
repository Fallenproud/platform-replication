# Amarax Guarded Task Adapter

A product-owned admission and execution boundary in front of a trusted local Agent Task Queue provider.

The adapter does not copy upstream source. It invokes an approved `tq` binary through structured process arguments and applies Amarax policy, workspace, environment, timeout, audit, redaction and cancellation controls before local execution is admitted.

## Why this exists

The upstream queue intentionally accepts commands and ultimately executes them through an operating-system shell. That is useful for a trusted developer tool, but it is not sufficient authorization or isolation for AIKOV, Sophie-X or a shared control plane.

The adapter narrows the interface from arbitrary command text to:

- an approved executable;
- an array of explicit arguments;
- an existing workspace under an approved root;
- named environment references rather than literal values;
- an allow policy decision with actor and project context;
- a bounded timeout and validated queue name.

## Controls

- rejects missing, denied or expired policy decisions;
- requires user, agent or service actor context;
- rejects executable paths and executables outside the allowlist;
- resolves the working directory through real paths and enforces approved roots;
- accepts only configured environment-reference names;
- resolves references from the adapter process environment;
- never uses a shell in the adapter process;
- passes executable and arguments separately to `tq`;
- redacts resolved environment values from captured output;
- emits admission, start, output, cancellation and completion events;
- supports `AbortSignal` cancellation and bounded termination grace;
- returns a structured result with correlation and policy identifiers;
- supports dry-run without starting `tq`.

## Boundary

This adapter provides admission controls for a trusted local provider. It does not turn SQLite into a distributed scheduler, prove container isolation, prevent every behavior available inside an allowed executable, or replace Orynero's higher-level policy engine.

## Commands

- `node src/cli.mjs dry-run --root <repo> --config <config> --request <request>`
- `node src/cli.mjs execute --root <repo> --config <config> --request <request>`

Configuration and request files are JSON. See `guarded-task.example.json` and `request.example.json`.

## Status

Original Amarax workstream. Promotion requires unit tests, pinned-upstream integration, cancellation tests, process-tree review, notice packaging and a target AIKOV integration.