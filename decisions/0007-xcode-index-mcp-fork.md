# Decision 0007 — Governed Optional Xcode Index MCP Fork

## Status

Accepted conditionally on 2026-07-25. Supersedes Decision 0006.

## Decision

Maintain a narrow, optional, upstream-tracked fork of `block/xcode-index-mcp` as a candidate implementation of Voltino's macOS and Swift semantic-index provider.

The fork may enter a product repository only after macOS build reproduction, dependency review, transport hardening, path validation, asset review and product-owned adapter tests pass.

## Corrected license evidence

The pinned repository contains `LICENSE.txt` with Apache License 2.0. The earlier review checked the wrong root filename and incorrectly treated the repository as unlicensed. The correction is recorded rather than erased.

## Rationale

The repository offers useful integration logic between MCP, Python, a Swift sidecar, Xcode DerivedData and IndexStoreDB. Reusing that narrow provider logic can reduce implementation time.

Direct adoption is unsuitable because the current implementation:

- follows IndexStoreDB's `main` branch;
- uses a fixed localhost TCP port;
- has no explicit transport authentication handshake;
- writes Goose-specific log paths;
- is platform-specific and early-stage;
- lacks completed build, dependency and asset evidence.

## Product boundary

Voltino owns the language-neutral `CodeIndexProvider` contract. The fork is only one optional backend implementation. Core Voltino, Sophie-X and AIKOV code must not depend directly on Xcode, DerivedData, USR formats, Python MCP internals or Swift service message shapes.

## Required fork changes

- pin IndexStoreDB and Swift dependencies;
- use a managed child process, Unix-domain socket or ephemeral authenticated port;
- add lifecycle supervision, readiness checks and failure recovery;
- validate project identity, DerivedData roots and source paths;
- normalize symbols and occurrences into Voltino contracts;
- remove Goose-specific paths and branding;
- add query limits, cancellation and index freshness metadata;
- add macOS CI for Python, Swift and adapter integration tests;
- preserve Apache-2.0 and applicable notices.

## Consequence

The provider can accelerate Swift and Apple-platform refactoring support without making the broader developer platform dependent on Xcode. Maintenance ownership and upstream synchronization become explicit costs of the fork.