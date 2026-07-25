# Guarded Task Adapter Results

**Date:** 2026-07-25  
**Workflow run:** `30149837231`  
**Decision:** `0008-guarded-task-adapter.md`

## Result

The first original AIKOV-facing implementation package has been completed under:

```text
workstreams/guarded-task-adapter/
├── README.md
├── guarded-task.example.json
├── request.example.json
├── package.json
├── src/
│   ├── adapter.mjs
│   └── cli.mjs
└── test/
    ├── execution.test.mjs
    ├── helpers.mjs
    ├── policy.test.mjs
    └── fixtures/fake-tq.mjs
```

The package is a product-owned boundary in front of Agent Task Queue. It does not copy upstream source and does not expose the upstream provider's arbitrary command interface directly to agents.

## Verified admission controls

- actor identity and actor type;
- organization, project, and environment context;
- required policy decision identifier;
- allow-only outcome;
- policy expiry;
- queue-name pattern;
- executable basename and allowlist;
- explicit argument array;
- realpath working-directory enforcement;
- approved workspace roots;
- approved environment-reference names;
- bounded timeout;
- adapter-owned queue data directory.

## Verified execution controls

- provider process starts without `shell: true`;
- executable and arguments are forwarded as separate provider arguments;
- approved environment values are inherited through the controlled `tq` process environment rather than provider argv;
- stdout and stderr are redacted before they enter results or events;
- lifecycle events contain request, correlation, policy, actor, and project identifiers;
- provider exit `124` becomes `timed_out`;
- `AbortSignal` produces cancellation evidence;
- already-aborted requests do not start the provider;
- dry-run performs complete admission without execution.

## Pinned upstream integration

The adapter was tested against:

`block/agent-task-queue@ccb94ae25c2b286d62e7371fd4c0f7ce60e33efa`

The integration confirmed:

- the real `tq` CLI starts and executes through the adapter;
- a denied policy prevents execution;
- a shell-sensitive string remains one literal argument;
- the task receives its approved environment value;
- the value does not appear in adapter result JSON, event NDJSON, or provider argv;
- lifecycle completion evidence is emitted;
- the task result is stored only inside the approved disposable workspace.

## Important upstream distinction

The MCP `run_task` API supports environment values, but the pinned `tq` CLI does not expose a corresponding `-e` option.

The adapter initially attempted to use such an option during integration. The real provider rejected it. The final design injects values into the controlled provider process environment, which the queued child inherits. This is safer than serializing values into command arguments and accurately matches the actual CLI surface.

## Promotion state

| Gate | State |
|---|---|
| Original adapter contracts | Passed |
| Unit policy tests | Passed |
| Unit execution and cancellation tests | Passed |
| Pinned real-provider integration | Passed |
| Result and event redaction | Passed |
| Shell-sensitive argument integrity | Passed |
| Semantic command policy | Open |
| Production secret provider | Open |
| Real nested process-tree cancellation | Open |
| Sandbox provider | Open |
| Sidecar decision and Gradle inventory | Open |
| AIKOV target integration | Open |
| Final notices and distribution manifest | Open |

## Next work package

GitHub Issue #9 tracks production promotion into AIKOV. Until those exit criteria pass, Agent Task Queue remains a trusted local provider candidate rather than a production scheduler.