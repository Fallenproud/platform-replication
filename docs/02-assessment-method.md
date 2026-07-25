# Repository Assessment Method

## Stage 0 — Organization inventory

Classify the upstream owner as parent company, product brand, developer organization, open-source initiative, research group, or historical/archive organization.

## Stage 1 — Repository intake

Capture identity, purpose, default branch, archived state, latest activity, releases, language, size, stars, contributors, and canonical documentation.

## Stage 2 — License and provenance

Inspect LICENSE, NOTICE, headers, package manifests, generated assets, fonts, datasets, models, documentation, examples, and transitive dependencies.

## Stage 3 — Runtime reconstruction

Build locally in an isolated environment. Record required services, databases, message brokers, credentials, platform APIs, hardware, and private assumptions.

## Stage 4 — Architecture map

Identify domain modules, control plane, data plane, APIs, events, state stores, extension points, observability, permissions, and deployment topology.

## Stage 5 — Risk review

Score security, maintenance, bus factor, release discipline, dependency health, data handling, supply-chain exposure, and operational complexity.

## Stage 6 — Product mapping

Map the capability to exactly one primary Amarax or Daycostra target and any secondary consumers. Do not merge unrelated products merely because they share a technical pattern.

## Stage 7 — Disposition

Choose ADOPT, FORK, REFERENCE, or REJECT. Record rationale, conditions, owner, review date, and implementation package.

## Required scoring dimensions

Each uses a 0–5 scale:

- product fit;
- license confidence;
- self-hostability;
- architectural independence;
- maintenance health;
- security confidence;
- integration cost;
- replacement difficulty.

Scores support judgment; they do not replace it.
