# Decision 0006 — Xcode Index MCP as Clean-Room Reference

## Status

Accepted on 2026-07-25.

## Decision

Use `block/xcode-index-mcp` only as evidence of an observable two-process semantic-index architecture. Do not copy, fork, modify, vendor or distribute its source under the current repository state because no explicit source license was found.

## Rationale

The architecture is relevant to Voltino: an MCP-facing adapter can translate product-neutral symbol queries into a platform-specific Xcode and IndexStoreDB provider. The implementation is not legally cleared for reuse and is technically coupled to macOS, Xcode DerivedData, a fixed local port and an unpinned IndexStoreDB branch.

## Clean-room boundary

The implementation team may use:

- public MCP specifications;
- public Apple, Swift and IndexStoreDB documentation;
- independently written tests and product requirements;
- observable input and output behavior described in public documentation.

The implementation team must not copy upstream source text, prompts, screenshots, assets or internal structure into the product codebase.

## Target architecture

Voltino owns a language-neutral `CodeIndexProvider` contract. Optional implementations may include Xcode IndexStoreDB, LSP, TypeScript language services and repository parsers.

## Reassessment

Source reuse may be reconsidered only after the upstream repository adds a clear compatible license and passes a new full assessment.