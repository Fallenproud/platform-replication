# Replication Policy

## Separate the four legal and technical layers

1. **Copyright license** — permission to use, modify, and distribute source.
2. **Trademark** — names, logos, visual identity, and endorsement claims.
3. **Service and API terms** — rules for hosted services and third-party APIs.
4. **Regulation** — obligations created by payments, lending, custody, identity, or other regulated operations.

Rebranding only addresses part of the trademark layer. It does not replace license compliance, service terms, or regulatory obligations.

## Intake gates

A repository cannot move beyond research until all gates have evidence:

- canonical upstream repository identified;
- exact commit or release pinned;
- license file captured and classified;
- NOTICE and attribution requirements recorded;
- dependency licenses reviewed;
- build path reproduced;
- external and private service dependencies identified;
- secrets and telemetry behavior inspected;
- security posture reviewed;
- target product owner identified;
- disposition decision approved.

## Default treatment by license

- Apache-2.0 / MIT / BSD: generally eligible for commercial review, with notices preserved.
- MPL: file-level reciprocal obligations require boundary review.
- LGPL: linkage and modification model require review.
- GPL: distribution model and derivative-work boundaries require review.
- AGPL: network use may trigger source obligations; default to legal review.
- Source-available or custom license: no assumption of open-source rights.
- No license: REJECT for code reuse; architecture study only where lawful.

## Provenance

Every adopted or forked component must record:

- upstream URL;
- upstream commit or release;
- license identifier;
- copyright holder;
- local modifications;
- dependency lock state;
- review date;
- decision owner;
- target module.

This policy is an engineering control, not a substitute for legal advice.
