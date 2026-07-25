# Target Architecture

The replication program produces evidence and approved components. It is not itself the Amarax or Daycostra production monorepo.

## Program layers

1. **Discovery layer** — organization and repository catalog.
2. **Evidence layer** — immutable upstream facts, licenses, commits, tests, and observations.
3. **Assessment layer** — normalized scores, dependency maps, and risk findings.
4. **Decision layer** — ADOPT, FORK, REFERENCE, or REJECT records.
5. **Engineering layer** — forks, adapters, clean-room specifications, and work packages.
6. **Qualification layer** — security, performance, legal, observability, and release evidence.

## Product mapping examples

- Agent runtime and MCP components → AIKOV or a clearly named Daycostra runtime package.
- Thread/session control → Daycostra Threads Monitor and Record & Replay.
- Mature SDK patterns → Daycostra Developer Platform.
- Website theme and builder patterns → SnapForge or a distinct website-generation extension.
- Fleet-management patterns → specialized operational control-plane products.
- Commerce SDK examples → integration adapters, not an assumption that payment infrastructure is reproduced.

## Dependency rule

Third-party source must enter products through explicit boundaries:

- package dependency;
- isolated service;
- governed fork;
- adapter;
- generated client;
- clean-room compatible implementation.

Untracked copying is prohibited.
