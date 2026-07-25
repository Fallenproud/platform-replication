# Repository Assessment — block/thread-manager-for-amp

- **Pinned revision:** `126cf2234a13a08a93d0d4cbd758a8fc77301d78`
- **Default branch:** `main`
- **License:** Apache-2.0, verified
- **Provisional disposition:** **REFERENCE**
- **Primary target:** Daycostra Threads Monitor, Workboard, Record & Replay

## Executive finding

Thread Manager for Amp is a rich local control surface for concurrent coding-agent threads. It provides table, card and Kanban views; WebSocket streaming; integrated PTY terminals; message rendering; labels; blockers; handoffs; thread chains; related-thread discovery; full-text search; git activity correlation; skills management; MCP status; artifacts; and extensive theme support.

Its product fit is excellent, but its runtime boundary is not suitable for direct production adoption. The application is deliberately designed as a single-user localhost tool. It depends on the Amp CLI, Amp credentials, Amp thread JSON files, an Amp internal API client, local SQLite metadata and full user-level PTY access. Its API and WebSocket surfaces have no authentication.

The correct use is as an evidence-backed architecture and interaction reference. Individual generic components may later be extracted under Apache-2.0 after component-level dependency and provenance review, but the repository should not become the Daycostra session authority.

## Architecture observed

```text
React 19 / Vite client
  - Thread list, card and Kanban views
  - Terminal, message renderer and minimap
  - Search, filters, commands, themes
                |
         HTTP + WebSocket
                |
Local Node.js server
  - thread CRUD and search
  - metadata and blockers
  - git status, diffs and activity
  - skills and MCP status
  - terminal PTYs
  - artifacts and export
                |
   Amp files + Amp API + SQLite + filesystem
```

## Valuable patterns for Daycostra

| Upstream pattern | Daycostra target | Treatment |
|---|---|---|
| Sortable/filterable thread inventory | Threads Monitor | Reconstruct against Daycostra contracts |
| Card and Kanban views | Workboard | Reuse interaction model, not data authority |
| WebSocket streaming and reconnect | Runtime event stream | Implement authenticated project-scoped stream |
| Multiple terminal tabs and layouts | Sandbox Manager | Replace raw local PTY with sandbox sessions |
| Handoffs and thread chains | Session branching | Map to explicit parent session/checkpoint records |
| Related threads by changed files | Project Graph | Implement evidence-backed relationship queries |
| Git commit/branch/PR correlation | Artifacts and observability | Integrate through repository adapters |
| Skills and MCP status | Skill/Tool Registry | Read from canonical registries |
| Images and notes | Artifact Registry | Store through managed artifact contracts |
| Themes from semantic tokens | Design system | Retain pattern, regenerate with Daycostra tokens |

## Direct-adoption blockers

### Amp coupling

The repository requires the Amp CLI and reads Amp-owned thread files and credentials. `server/lib/amp-api.ts` is a product-specific dependency, not a generic agent protocol.

### Security model

The upstream security policy explicitly states:

- localhost-only operation;
- no API authentication;
- no WebSocket authentication;
- local access to Amp credentials;
- full PTY access as the host user;
- potentially sensitive coding-session data.

Those assumptions cannot cross into a cloud, multi-user or organization-scoped control plane.

### Persistence model

Thread authority is split between Amp JSON files, SQLite metadata and local artifacts. Daycostra requires one canonical session model with explicit project and organization scope, retention, provenance, policy decisions and audit events.

### Destructive actions

Local confirmations are not sufficient. Archive, delete, restore, branch, PTY creation and transcript access must be authorized server-side and produce audit evidence.

## Daycostra replacement boundary

The clean target is:

```text
Threads Monitor UI
        |
Session SDK and contracts
        |
Authenticated API + event stream
        |
Session Runtime / Checkpoint Runtime / Workboard Runtime
        |
Policy + Audit + Artifact + Project Graph
        |
Sandboxed execution providers
```

The upstream Amp adapter must be treated as one optional provider, not as the domain model.

## Candidate component extraction

The following areas may warrant isolated follow-up audits:

- generic table selection, filtering and bulk-action utilities;
- theme derivation from background, foreground and accent tokens;
- terminal layout and reconnect state machine;
- conversation minimap;
- command registry;
- git activity correlation algorithms;
- thread-chain and related-file visualization;
- Markdown and image export.

Each extraction must preserve the Apache-2.0 license and relevant notices and must not carry hidden Amp assumptions.

## Build status

The build has **not** been reproduced in the current assessment environment. Dependency review remains pending. The repository's own documented prerequisites include Node.js 24+, pnpm 10+, native compilation for `better-sqlite3` and `node-pty`, and an installed/authenticated Amp CLI.

## Decision

**REFERENCE.**

Use the repository to accelerate the Daycostra Threads Monitor and Workboard design, source-to-target mapping and isolated utility extraction. Do not fork it into production as the session control plane. Daycostra must own identity, tenancy, authorization, session state, checkpoint semantics, artifacts, retention, audit and execution isolation.
