# Isolated Prototype — Thread Monitor Provider Adapter

This prototype defines how a local or third-party thread source can feed Daycostra Threads Monitor without becoming the canonical Session domain.

No `thread-manager-for-amp` source is copied here. The first provider may read an isolated fixture or an explicitly configured local source; later providers can target AIKOV, Goose/ACP, Amp, remote workers or other runtimes.

## Provider-neutral topology

```text
External thread/session source
            |
     Provider adapter
            |
 canonical Session ingestion contract
            |
 Daycostra Session Runtime and Project Graph
            |
 Threads Monitor / Workboard / Record & Replay
```

## Non-negotiable boundaries

- Provider credentials are referenced through secret IDs and never stored in UI state.
- Imported sessions are assigned organization and project scope before persistence.
- External IDs remain provenance fields, not primary product authority.
- Transcripts, checkpoints, artifacts and git observations have independent retention policies.
- Destructive operations are disabled unless the provider explicitly supports them and Orynero authorizes them.
- A provider cannot expose a raw PTY directly to a browser.
- Every mutation emits a PolicyDecision, AuditLog and RuntimeEvent.

## First proof of concept

The first implementation should be read-only:

1. discover provider capabilities;
2. list sessions;
3. fetch normalized session details;
4. stream normalized status and message events;
5. map external parent/child relationships;
6. surface unsupported operations explicitly.

Write, archive, branch, restore and terminal operations stay disabled until the runtime, policy and recovery tests are complete.
