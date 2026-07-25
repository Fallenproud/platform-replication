# Amarax AI Rules Wrapper

A product-owned safety boundary around a pinned `ai-rules` binary.

The wrapper does not copy or modify upstream source. It executes an approved binary in a disposable staging copy, validates the resulting file changes, and applies only explicitly allowed outputs to the real repository.

## Why this exists

Direct generator execution can create, replace, delete, or symlink repository files. Documentation and runtime behavior can also drift; the pinned AI Rules v1.7.0 assessment found that Cursor standard mode generated a shared root `AGENTS.md` rather than the `.cursor/rules/*.mdc` path described in upstream documentation.

The wrapper therefore treats observable staged output as evidence and enforces Amarax-owned constraints before the repository is mutated.

## Guarantees

- validates MCP environment values as secret references rather than literal credentials;
- copies the working tree into a temporary staging directory;
- runs the pinned compiler only inside staging;
- computes before/after file and symlink digests;
- rejects any changed path outside `allowedOutputs`;
- supports dry-run without mutating the real repository;
- applies approved changes transactionally from staging;
- writes `.amarax/ai-rules-manifest.json` with compiler, source and output digests;
- verifies source and generated-output drift without rerunning the compiler;
- cleans only outputs recorded in the manifest;
- never treats generated prompt files as runtime authorization or policy decisions.

## Commands

From this directory:

- `node src/cli.mjs generate --root <repo> --config <config>`
- `node src/cli.mjs generate --dry-run --root <repo> --config <config>`
- `node src/cli.mjs verify --root <repo> --config <config>`
- `node src/cli.mjs clean --root <repo> --config <config>`

The config path is resolved relative to `--root`. Copy `ai-rules.wrapper.example.json` into a target repository and pin the binary through the repository's approved toolchain.

## Security boundary

The wrapper controls repository mutation. It does not make generated MCP servers safe, validate external commands beyond secret-reference checks, or grant agents permission to use produced tools. Orynero and AIKOV remain responsible for runtime authorization, approvals, sandboxing and audit.

## Import status

This workstream is original Amarax code. It is a prototype until tests, Windows behavior, nested scopes, notice packaging and a target-repository integration have passed.