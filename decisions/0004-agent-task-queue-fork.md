# Decision 0004 — Governed Agent Task Queue Fork

## Status

Accepted conditionally on 2026-07-25.

## Decision

Maintain a narrow, upstream-tracked fork of `block/agent-task-queue` for trusted local developer execution beneath AIKOV Guarded Build.

The upstream task queue is not the authoritative AIKOV scheduler, policy engine, tenancy layer, or remote execution service. It is one execution provider behind product-owned contracts.

## Rationale

The queue, timeout, process supervision, MCP, CLI and local observability capabilities are valuable and compact. Direct adoption is unsuitable because the main tool intentionally executes arbitrary shell text using the caller's filesystem and environment authority.

A fork is justified only to isolate security controls and product adapter boundaries while retaining upstream fixes.

## Required boundaries

- AIKOV owns admission and policy decisions.
- Orynero owns approval and destructive-action policy.
- A sandbox provider owns process isolation and quotas.
- The fork owns trusted local queueing and process lifecycle only.
- Product code consumes an Amarax `TaskSchedulerProvider` contract.

## Prohibited assumptions

- Local SQLite is not a distributed queue.
- An MCP client identity is not sufficient tenant identity.
- User-visible command text is not authorization.
- Shell execution is not safe merely because the server is local.
- Output files are not immutable audit evidence.

## Merge gates

No fork source enters an Amarax product repository until build reproduction, dependency review, source notices, security tests, command-policy design, secret handling, sandboxing and upstream sync ownership are complete.