# Decision 0002 — Governed Goose runtime fork

- **Status:** Accepted with gates
- **Date:** 2026-07-25
- **Repository:** `aaif-goose/goose`
- **Pinned assessment ref:** `192b5db8b947f91e8a6ceca67b4773dc28ae6169`
- **Disposition:** FORK

## Context

Goose provides a general-purpose local agent runtime, CLI, desktop application, API/ACP server, provider abstraction, MCP extension system, recipes and documented custom-distribution support. These capabilities overlap materially with AIKOV, Sophie-X and Voltino.

## Decision

Create a separately maintained, upstream-tracked distribution after the build, security, provenance and dependency gates pass. Do not vendor Goose directly into the Daycostra or Amarax Central monorepos.

The internal integration boundary will be a narrow adapter over ACP and explicit Amarax contracts. Product-specific tools should be implemented primarily as MCP extensions or external services. Branding, defaults, configuration and packaging remain downstream concerns.

## Required controls

- pinned upstream revisions and signed release artifacts;
- reproducible CLI, server, SDK and desktop builds;
- full dependency and vendored-code license inventory;
- Apache-2.0 compliance and modification records;
- independent names, icons, executable IDs and update channels;
- telemetry disabled or redirected;
- Orynero policy enforcement around tools and secrets;
- recurring upstream synchronization and security review;
- no claim of endorsement by AAIF, Block or Goose.

## Consequences

### Positive

- major reduction in time needed for a capable multi-provider MCP agent runtime;
- an established Rust core and cross-platform distribution path;
- externalizable tools and workflows;
- documented customization model;
- cleaner separation between runtime and Amarax product surfaces.

### Negative

- ongoing fork maintenance;
- a large Rust, Node and Electron dependency surface;
- security responsibility for tool execution and provider credentials;
- possible migration work when upstream ACP, MCP or internal APIs change.

## Revisit trigger

Revisit this decision if the isolated build fails, license/dependency review exposes incompatible obligations, upstream governance changes materially, or the adapter cannot keep the product fork delta narrow.
