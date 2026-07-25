# Repository Assessment — aaif-goose/goose

- **Pinned revision:** `192b5db8b947f91e8a6ceca67b4773dc28ae6169`
- **Observed workspace version:** `1.44.0`
- **Default branch:** `main`
- **License:** Apache-2.0, verified at repository and workspace level
- **Provisional disposition:** **FORK**, conditional
- **Primary target:** AIKOV runtime with controlled adapters into Sophie-X and Voltino

## Executive finding

Goose is the strongest first-wave runtime candidate in this program. It is not merely an example agent: the upstream project provides a Rust core, CLI, Electron desktop application, an embeddable API/server surface, model-provider abstraction, MCP extensions, recipes, subagent-capable workflows, keyring-backed secrets, telemetry controls, and documented custom-distribution support.

The upstream documentation explicitly describes white-labelled distributions with custom providers, tools, branding, defaults, recipes, and custom clients over ACP. That makes a governed fork technically and legally plausible. It does **not** remove the need for a reproducible build, dependency-license inventory, security review, asset review, trademark separation, telemetry decision, and an upstream-sync plan.

## Architecture observed

```text
Custom UI / Voltino / CLI / Desktop
                 |
          ACP HTTP/WebSocket
                 |
           Goose core crates
       /          |          \
 providers   MCP extensions   configuration/recipes
       \          |          /
          local tools and model APIs
```

The current repository is a mixed Rust and TypeScript/Electron workspace:

- Rust workspace members under `crates/*`;
- a desktop application under `ui/desktop`;
- ACP and MCP protocol dependencies;
- built-in and bundled extension catalogs;
- system prompts and provider implementations;
- keyring and file-based secret handling;
- OpenTelemetry and optional PostHog telemetry;
- tree-sitter language support;
- vendored and git-patched dependencies that require special provenance review.

## Capability mapping

| Goose capability | Amarax/Daycostra target | Treatment |
|---|---|---|
| Rust agent core | AIKOV runtime | Candidate fork boundary |
| Provider abstraction | AI Gateway / model routing | Adapt through an internal provider contract |
| MCP extensions | Tool Registry / Plugin Hub | Reuse protocol boundary; curate extensions separately |
| ACP server | Voltino and custom clients | Preferred isolation interface |
| Desktop shell | Voltino desktop distribution | Reference or optional downstream shell |
| CLI | Developer and automation surface | Retain with rebranded command and config paths |
| Recipes | Skills and repeatable workflows | Map into versioned Skill definitions |
| Subagents | SophieSwarm execution | Integrate behind policy and budget controls |
| Secret storage | Orynero secret references | Replace direct product authority with policy-governed secret access |
| Telemetry | Daycostra observability | Disable upstream endpoint or redirect to an approved instance |

## Why FORK instead of ADOPT

Direct adoption would leave product identity, defaults, telemetry behavior, configuration paths, extension catalogs, update channels, and policy boundaries under upstream assumptions. A maintained fork allows us to provide an independent distribution while keeping the core delta narrow.

The fork must not become a free-running rewrite. The preferred delta order is:

1. configuration and init files;
2. external MCP extensions;
3. adapter packages;
4. branding and packaging;
5. only then carefully isolated core changes.

## Mandatory gates before source import

1. Reproduce CLI, server, SDK, and desktop builds from the pinned revision.
2. Produce complete Cargo and pnpm dependency-license inventories.
3. Inspect `vendor/`, git dependencies, generated files, fonts, images, models, and binary assets.
4. Run static analysis, secret scanning, dependency vulnerability scanning, and permission-boundary review.
5. Define provider credential handling and remove any assumption that an agent may access unrestricted secrets.
6. Disable or redirect PostHog telemetry.
7. Rename application identifiers, executable names, config directories, icons, update feeds, and package metadata.
8. Preserve Apache-2.0 material and applicable copyright notices; document changed files.
9. Define a recurring upstream merge and security patch process.
10. Implement an AIKOV adapter rather than coupling product code directly to upstream internals.

## Initial risk register

| Risk | Severity | Current handling |
|---|---:|---|
| Large multi-language dependency surface | High | Dependency review pending |
| Vendored and git-patched code | High | Explicit provenance gate |
| Agent tool execution and extension permissions | High | Must be wrapped by Orynero policy |
| Provider and API credentials | High | Map to secret references, not raw product config |
| Telemetry leakage | Medium | Disable or redirect before distribution |
| Fork divergence | Medium | Keep delta outside core and sync upstream |
| Trademark confusion | Medium | Complete rebrand and no endorsement claim |
| Desktop auto-update and packaging | Medium | Separate signed distribution pipeline required |

## Build status

The build has **not** been reproduced in the current assessment environment. The machine-readable record therefore retains `build_reproduced: false` and dependency review remains `pending`.

## Decision

**FORK — conditional.**

Goose should become an isolated upstream-tracked runtime distribution, not be copied piecemeal into the Daycostra monorepo. Amarax-specific capabilities should enter through adapters, MCP extensions, recipes, configuration and policy gates. No product repository receives source until the build, security, provenance and dependency gates pass.
