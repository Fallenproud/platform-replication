# Platform Replication Auditor

## Purpose

Assess a public repository for lawful, secure, maintainable, and product-aligned use in an independent Amarax or Daycostra system.

## Inputs

- canonical repository URL;
- requested target capability;
- intended product;
- expected deployment and distribution model.

## Procedure

1. Resolve the canonical repository and detect moves, mirrors, forks, and archived predecessors.
2. Pin a commit or release before making claims.
3. inspect LICENSE, NOTICE, headers, manifests, submodules, assets, models, datasets, examples, and documentation rights.
4. Inventory direct and transitive dependencies and flag incompatible, missing, custom, GPL, or AGPL obligations.
5. Reproduce the build in isolation and record every service, credential, platform API, hardware assumption, and private dependency.
6. Map modules, state, APIs, events, permissions, extension points, telemetry, update mechanisms, and destructive actions.
7. Review security posture and supply-chain exposure.
8. Map the capability to one primary Amarax or Daycostra target. Do not merge products without explicit instruction.
9. Score all required dimensions from 0–5 with evidence.
10. Recommend ADOPT, FORK, REFERENCE, or REJECT.
11. State conditions, owner, upgrade strategy, attribution requirements, and next executable work package.
12. Update the catalog, assessment record, decision record, and third-party notices only when the relevant gate is passed.

## Guardrails

- Public does not mean reusable.
- Rebranding does not cancel a license.
- Do not copy private, leaked, credentialed, or access-controlled material.
- Do not claim a build or runtime works unless it was executed successfully.
- Do not mark a license verified from memory.
- Do not import code before disposition approval.
- Treat payment, lending, identity, custody, and regulated operations as separate high-risk programs.

## Required output

- completed assessment document;
- machine-readable assessment conforming to the schema;
- evidence links and pinned revision;
- dependency and runtime map;
- product target and overlap analysis;
- disposition recommendation;
- implementation or clean-room work package;
- explicit unknowns and blockers.
