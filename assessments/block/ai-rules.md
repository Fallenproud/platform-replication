# Repository Assessment — block/ai-rules

## Decision

**ADOPT — conditional, as developer tooling.**

AI Rules solves a concrete ecosystem problem: one canonical set of instructions, commands, skills, and MCP configuration can be compiled into the file layouts expected by many coding agents. That is directly relevant to Amarax repositories, Codex CLI, Sophie-X supporting agents, Goose distributions, and the shared `skills.md` library.

It must not be confused with policy enforcement. The tool distributes text and configuration files; it does not decide whether an agent is authorized to execute an action, access a secret, mutate production, or cross tenant boundaries.

## Pinned upstream

- Repository: `block/ai-rules`
- Commit: `b2c1cd16d05f47053eb3f059f87524f7b6ee1a1f`
- Version observed: `1.7.0`
- License: Apache-2.0
- Build reproduction: **passed** through format, Clippy, tests and release build in workflow run `30147827108`
- Dependency review: **conditional**

## Capability map

- Canonical markdown rule source.
- Multi-agent rule generation.
- Selective agent targets.
- Nested monorepo rule scopes.
- Standard and symlink modes.
- Shared commands and skills.
- MCP configuration generation.
- Codex configuration overlays.
- Status and drift detection.
- Generated-file cleanup.
- Repository-local YAML configuration.

## Target mapping

| Upstream capability | Amarax target |
|---|---|
| Canonical rule source | Repository `ai-rules/` truth layer |
| Agent-specific outputs | Codex, Goose, Claude, Gemini and other agent adapters |
| Shared skills | Canonical `skills/` and `SKILLS.md` distribution |
| MCP source transformation | Approved MCP configuration compiler |
| Nested scopes | Monorepo package-specific agent instructions |
| Status command | CI drift enforcement |

## Product boundary

AI Rules should be wrapped as an `InstructionCompiler` provider. The wrapper owns:

- pinned version;
- input directory;
- allowed output paths;
- target agent selection;
- dry-run and diff reporting;
- secret-reference validation;
- CI verification;
- audit metadata.

The canonical policy chain remains:

`Human/project rules → instruction compiler → agent-specific files → agent runtime → Orynero policy decision → tool execution`

The compiler occupies only the second step.

## Risks and controls

Generated files and symlinks can overwrite or redirect repository paths. The `clean` command can remove generated artifacts. MCP configurations can accidentally contain literal secrets or unsafe commands. Nested generation can write to multiple packages.

Required controls:

1. run from a known repository root;
2. restrict output to approved paths;
3. perform dry-run or generated diff before mutation;
4. reject literal credentials and secret values;
5. generate into CI and require a clean git diff;
6. separate product policy from agent prompt content;
7. preserve provenance of generated files.

## Reproduction evidence

The pinned source completed Apache license verification, `cargo fmt --check`, the upstream Clippy script, the full Rust test suite and a release build in GitHub Actions. The core binary is therefore reproducibly buildable in the tested Linux environment.

## Dependency evidence

Locked Cargo metadata produced a checked-in dependency inventory, license CSV and CycloneDX SBOM under `evidence/dependencies/ai-rules/`.

- Components: **110**
- Evidence-backed metadata corrections required: **0**
- Remaining unresolved normalized license fields: **0**

The inventory includes several multi-license expressions. Their presence is not automatically problematic, but the intended option must be selected consistently when notices and distributed artifacts are prepared. Installer behavior, binary-release provenance, license files, assets, generated outputs and non-package content remain separate review surfaces.

## Remaining import gates

- Inspect installer behavior and binary provenance.
- Select and document the applicable option for multi-license dependencies where distribution requires it.
- Review dependency license files and generate the final product-specific notice set.
- Test standard mode, symlink mode, nested scopes, clean, status, MCP generation, commands, and skills as product workflows.
- Validate Windows behavior where symlink permissions differ.
- Add an Amarax wrapper and canonical config example without modifying upstream core.

## Final position

This repository can be adopted with minimal modification. The preferred model is upstream consumption through a pinned wrapper rather than a long-lived fork. It becomes a repository instruction compiler, while Sophie-X, AIKOV and Orynero retain runtime intelligence, authorization and execution authority.