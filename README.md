# Platform Replication

A governed research and engineering program for evaluating, reconstructing, and selectively adopting open-source platform components into independent Amarax and Daycostra products.

This repository is **not** a mirror of Block, Square, Cash App, Weebly, Afterpay, TIDAL, Proto, Spiral, c equals, or any other third-party company. It is the canonical workspace for:

- repository-by-repository technical assessment;
- license and attribution review;
- architecture reconstruction;
- dependency and self-hostability analysis;
- adopt / fork / reference / reject decisions;
- clean-room replacement planning where source reuse is unsuitable;
- implementation plans for independent, rebranded products.

## Core rule

Public source code is not automatically reusable. Every repository must pass license, dependency, security, maintainability, and product-fit gates before code enters an Amarax or Daycostra codebase.

## Current program

The first research program maps the public Block ecosystem and related GitHub organizations into a structured replication matrix. The goal is to determine which components can be adopted directly, forked with preserved notices, used only as architectural references, or rejected.

See the program documentation under `docs/`, the repository catalog under `catalog/`, and decision records under `decisions/`.
