# Isolated Prototype — Goose Runtime Adapter

This directory defines the **product-owned boundary** between Amarax/Daycostra systems and a possible governed Goose fork.

It intentionally contains no upstream Goose source. The prototype exists to prevent AIKOV, Sophie-X and Voltino from coupling directly to Goose crates, desktop components, configuration files or update behavior.

## Intended topology

```text
Sophie-X / Voltino / AIKOV
            |
  Amarax Runtime Adapter API
            |
  ACP client and policy bridge
            |
  governed Goose distribution
            |
 providers, MCP extensions and tools
```

## Boundary rules

- Amarax owns session IDs, project scope, actor identity and policy context.
- Orynero authorizes tools and secret references before requests reach the runtime.
- The adapter translates product contracts to ACP or another stable upstream surface.
- Upstream-specific events are normalized into Daycostra RuntimeEvents.
- Provider keys are never embedded in frontend or recipe payloads.
- Telemetry and update behavior are controlled by the downstream distribution.
- No product entity may depend on Goose internal crate types.

## Prototype phases

1. Contract compile and test doubles.
2. Read-only health, capability and provider discovery.
3. Session create/send/stream/cancel against an isolated upstream build.
4. MCP tool inventory with deny-by-default policy decisions.
5. Artifact, usage, token and audit event normalization.
6. Failure injection, restart recovery and version compatibility tests.

## Exit criteria

The adapter is accepted only when the upstream runtime can be upgraded or replaced without changing Sophie-X, Voltino or core Daycostra domain models.
