# Block Ecosystem Inventory — Wave 1

**Date:** 2026-07-25  
**Scope:** canonical organization map plus prioritized repository discovery  
**Status:** first-wave inventory complete; exhaustive pagination and per-repository license verification remain open

## Classification rule

A public repository is classified by what it actually contains, not by the commercial brand that owns it. SDKs, samples, libraries, local control tools and research repositories do not imply that the corresponding hosted product backend is open source.

## Organization map

| Ecosystem unit | GitHub organization | Observed source category | Initial replication value |
|---|---|---|---|
| Block | `block` | shared infrastructure, agent tooling, MCP, operations and service frameworks | High |
| Square | `square` | foundational Android/JVM/Swift libraries | Medium, stack-dependent |
| Square Developers | `Square-Developers` | API samples and reference integrations | Reference only by default |
| Cash App | `cashapp` | mobile architecture, testing, runtimes and service frameworks | Medium to high |
| Weebly | `Weebly` | themes, clients, webhooks and general libraries | Narrow; builder backend absent |
| Afterpay | `afterpay` | merchant integrations and SDKs | Integration reference |
| TIDAL | `tidal-music` | SDKs, embed player, algorithms and infrastructure utilities | Vertical-specific |
| Proto | `proto-at-block` plus selected `block` repositories | wallet, hardware and fleet operations | Specialized; security-sensitive |
| Spiral | `spiralxyz` | Bitcoin educational/open-source initiative material | Narrow current repository surface |
| c equals | `cequals` | Bitcoin and Lightning infrastructure | Specialized; high assurance burden |
| Goose / AAIF | `aaif-goose` | full local agent runtime and distribution | Highest immediate value |

## Priority discoveries

### Runtime and agent systems

- `aaif-goose/goose` — full agent runtime, CLI, desktop, API/ACP and MCP extension system. Initial decision: conditional FORK.
- `block/thread-manager-for-amp` — rich thread/session UI and local backend. Initial decision: REFERENCE.
- `block/agent-task-queue` — candidate coordination primitive.
- `block/ai-rules` — candidate instruction/rule distribution layer.
- `block/xcode-index-mcp` and `block/vscode-mcp` — developer-tool MCP candidates.
- `block/mcp-council-of-mine` — multi-agent deliberation/research candidate.
- `block/goose-discord` — channel integration candidate requiring canonical-upstream alignment.

### Service and data systems

- `block/ftl` — potentially significant backend/service framework.
- `block/elasticgraph` — GraphQL/search data platform candidate for Project Graph and evidence queries.
- `block/buzz` — communications platform candidate relevant to Velora Voice.
- `cashapp/misk` — Kotlin service framework; likely architecture reference for the current TypeScript-oriented platform.
- `cashapp/zipline` and `cashapp/redwood` — cross-platform runtime/UI candidates with substantial integration and security review requirements.

### Operations and observability

- `block/proto-fleet` — fleet control-plane candidate; mining-specific parts must be separated from general operations patterns.
- `block/flight-control` — capability still requires confirmation.
- `cashapp/paparazzi` and `square/leakcanary` — mobile quality tooling.
- `cashapp/licensee` — candidate license-compliance component for JVM builds.

### Commerce and website surfaces

- Square Developers repositories are API samples and integration references rather than a Square backend recreation.
- Weebly exposes themes, clients and webhook helpers, but not the hosted visual builder, multi-tenant hosting platform or reseller control plane.
- Afterpay repositories are mainly SDKs and merchant integrations, not the credit, risk or settlement backend.

### Media and Bitcoin surfaces

- TIDAL publishes web/mobile SDKs, an embed player and algorithmic-mix research, all of which still rely on separate service and content rights.
- c equals and Proto repositories are technically reusable only after protocol, security, operational and regulatory product decisions; they are not automatically part of the Amarax core platform.

## Inventory conclusion

The ecosystem contains enough open source to accelerate major portions of an independent platform, particularly agent runtime, developer tooling, mobile architecture, operations, SDKs and integrations. It does not expose the complete commercial runtimes of Square, Cash App, Weebly, Afterpay or TIDAL.

The highest-value immediate sequence remains:

1. governed Goose fork assessment and build reproduction;
2. Daycostra thread/session reconstruction using Thread Manager as a reference;
3. compliance automation;
4. focused audits of agent-task-queue, ai-rules, editor MCP tools, FTL, ElasticGraph and Buzz;
5. vertical-specific work only after an explicit product need exists.
