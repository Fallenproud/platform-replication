# Repository Assessment — block/xcode-index-mcp

## Decision

**FORK — conditional, as an optional Voltino macOS provider.**

The repository demonstrates a useful two-process architecture for exposing Xcode's semantic index to coding agents through MCP. An initial review incorrectly classified the repository as unlicensed because it checked `LICENSE` but not `LICENSE.txt`. CI subsequently enumerated tracked files and found `LICENSE.txt`, which contains Apache License 2.0.

That correction removes the legal source-reuse block. It does not remove the technical gates: the implementation is early, macOS-specific, coupled to Xcode DerivedData, uses a fixed localhost port without an explicit authentication handshake, writes Goose-specific logs, and follows IndexStoreDB's unpinned `main` branch.

## Pinned upstream

- Repository: `block/xcode-index-mcp`
- Commit: `c89af82aee64c42690a60c2dda6d9e0f8bf022e9`
- Version observed: `0.1.0`
- Source license: Apache-2.0 in `LICENSE.txt`
- Build reproduction: pending on a pinned macOS runner

## Architecture

The repository contains two cooperating processes:

1. a Python MCP server;
2. a Swift executable that interfaces with Apple's IndexStoreDB.

The Python process launches the Swift executable, opens a TCP connection to localhost port 7949, sends newline-delimited JSON requests, and translates results into MCP tools.

Capabilities include:

- loading an Xcode DerivedData project index;
- symbol search;
- symbol occurrences by file and line;
- occurrence lookup by USR;
- definitions and call-site discovery;
- agent guidance for refactoring.

## Target mapping

| Upstream capability | Voltino target |
|---|---|
| MCP semantic index tools | `CodeIndexProvider` adapter |
| Xcode DerivedData discovery | Optional macOS Xcode provider |
| USR-based symbol identity | Canonical `SymbolId` field |
| Occurrences and definitions | Language-neutral query contracts |
| Swift sidecar | Authenticated managed child process |
| Refactoring instructions | Sophie-X coding-agent skill guidance |

## Why a governed fork is required

Direct adoption is not recommended because:

- the Swift package follows IndexStoreDB's `main` branch rather than a pinned revision;
- the implementation is strongly coupled to macOS, Xcode and DerivedData;
- the bridge uses a fixed local TCP port without an explicit authentication handshake;
- logging paths are Goose-specific;
- project and file-path validation require strengthening;
- build and dependency evidence is incomplete;
- repository assets require separate review.

A narrow fork allows us to preserve the useful provider logic while introducing product-owned boundaries and upstream synchronization.

## Required provider architecture

Voltino owns a platform-neutral contract with optional providers for:

- Xcode / IndexStoreDB;
- Language Server Protocol;
- tree-sitter or repository parsing;
- TypeScript language services;
- future IDE indexes.

The Xcode provider must:

1. run only on supported macOS hosts;
2. pin all Swift dependencies;
3. use a managed child process, Unix-domain socket, or ephemeral authenticated port;
4. validate DerivedData and source roots;
5. normalize symbols and occurrences into product-owned contracts;
6. limit query volume and response sizes;
7. record provenance and index freshness;
8. avoid modifying source code directly;
9. remove Goose-specific paths and branding;
10. remain optional so the core platform is not Xcode-dependent.

## Import gates

- Reproduce the Python package on the declared Python version.
- Reproduce the Swift build and tests on macOS.
- Pin IndexStoreDB and review its full dependency graph.
- Generate Python and Swift SBOM and license inventories.
- Review screenshots and other assets independently.
- Add authenticated transport, lifecycle supervision and failure recovery.
- Add product-owned adapter tests against the `CodeIndexProvider` contract.
- Preserve Apache-2.0 and applicable notices.

## Correction record

Decision 0006 recorded a REFERENCE-only decision based on the mistaken missing-license finding. It is retained as a superseded audit record. Decision 0007 replaces it with the conditional FORK decision.

## Final position

The source is legally reusable under Apache-2.0, but not ready for direct product import. A narrow, optional, upstream-tracked fork can become Voltino's Xcode semantic-index provider after build, dependency, security and adapter gates pass.