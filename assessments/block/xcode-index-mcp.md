# Repository Assessment — block/xcode-index-mcp

## Decision

**REFERENCE — source reuse prohibited under the current evidence.**

The repository demonstrates a useful architecture for exposing Xcode's semantic index to coding agents through MCP. However, no source license was found at the pinned revision, and the Python project metadata does not declare one. Public visibility does not grant permission to copy, modify, distribute, or build a derivative product.

The correct action is a clean-room, product-owned implementation based on public MCP and IndexStoreDB interfaces, not a fork.

## Pinned upstream

- Repository: `block/xcode-index-mcp`
- Commit: `c89af82aee64c42690a60c2dda6d9e0f8bf022e9`
- Version observed: `0.1.0`
- Source license: missing / `NOASSERTION`
- Build reproduction: not attempted as a reusable-source gate cannot pass

## Observable architecture

The repository contains two cooperating processes:

1. a Python MCP server;
2. a Swift executable that interfaces with Apple's IndexStoreDB.

The Python process launches the Swift executable, opens a TCP connection to localhost port 7949, sends newline-delimited JSON requests, and translates results into MCP tools.

Observable capabilities include:

- loading an Xcode DerivedData project index;
- symbol search;
- symbol occurrences by file and line;
- occurrence lookup by USR;
- definitions and call-site discovery;
- agent guidance for safe refactoring.

## Target mapping

| Observable capability | Voltino target |
|---|---|
| MCP semantic index tools | `CodeIndexProvider` adapter |
| Xcode DerivedData discovery | Optional macOS Xcode provider |
| USR-based symbol identity | Canonical `SymbolId` field |
| Occurrences and definitions | Language-neutral query contracts |
| Swift sidecar | Authenticated managed child process |
| Refactoring instructions | Sophie-X coding-agent skill guidance |

## Why direct reuse is blocked

- No LICENSE file was found.
- `pyproject.toml` does not declare a license.
- The Swift package follows IndexStoreDB's `main` branch rather than a pinned revision.
- The implementation is strongly coupled to macOS, Xcode and DerivedData.
- The bridge uses a fixed local TCP port without an explicit authentication handshake.
- Logging paths are Goose-specific.
- Repository assets may have separate or unknown rights.

## Clean-room implementation requirements

Voltino should own a platform-neutral contract with optional providers for:

- Xcode / IndexStoreDB;
- Language Server Protocol;
- tree-sitter or repository parsing;
- TypeScript language services;
- future IDE indexes.

The Xcode provider should:

1. run only on supported macOS hosts;
2. pin all Swift dependencies;
3. use a managed child process, Unix-domain socket, or ephemeral authenticated port;
4. validate DerivedData and source roots;
5. normalize symbols and occurrences into product-owned contracts;
6. limit query volume and response sizes;
7. record provenance and index freshness;
8. avoid modifying source code directly;
9. remain optional so the core platform is not Xcode-dependent.

## Reassessment trigger

A new audit may be opened if the repository adds a recognized source license. Even then, dependency, security, build, asset and product-fit gates would still be required.

## Final position

The concept is useful and worth recreating. The current source cannot be used as an Amarax or Voltino codebase input. We retain only the architecture lesson: an agent-facing semantic-index protocol should be separated from platform-specific index providers.