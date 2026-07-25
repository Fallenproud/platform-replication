# Decision 0001 — Four-way disposition model

## Status

Accepted for program bootstrap.

## Context

A public repository can be technically useful without being suitable for direct source reuse. A binary use/do-not-use model loses important distinctions.

## Decision

Every assessed repository receives exactly one disposition:

### ADOPT

Use upstream as a dependency or isolated service with minimal local changes. Prefer this when upstream is healthy, compatible, independent, and easy to upgrade.

### FORK

Maintain a derivative when local changes are essential and the license permits it. A fork requires upstream sync ownership, preserved notices, patch documentation, security updates, and a retirement plan.

### REFERENCE

Use public behavior, documentation, and architecture as research input while creating an independent implementation. Use when direct adoption is mismatched, overly coupled, or legally/operationally undesirable.

### REJECT

Do not use the repository for source adoption. Reasons include incompatible or missing license, unsafe dependencies, abandonment, excessive coupling, duplication, or poor product fit.

## Consequences

No repository may enter a production product while its disposition is UNDECIDED. Decisions remain conditional on the exact pinned revision and dependency set.
