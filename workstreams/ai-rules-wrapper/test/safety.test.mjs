import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { generate } from "../src/wrapper.mjs";
import { createFixture, exists, expectWrapperError } from "./helpers.mjs";

test("plain MCP credential values are rejected before compiler execution", async () => {
  const context = await createFixture({ plainCredential: true });
  try {
    await expectWrapperError(
      generate({ root: context.root, config: context.config }),
      "literal_secret",
    );
    assert.equal(await exists(path.join(context.root, "CLAUDE.md")), false);
  } finally {
    await context.dispose();
  }
});

test("undeclared compiler outputs are rejected without mutating the repository", async () => {
  const context = await createFixture({ compilerEnv: { DEMO_EXTRA_OUTPUT: "1" } });
  try {
    await expectWrapperError(
      generate({ root: context.root, config: context.config }),
      "unexpected_output",
    );
    assert.equal(await exists(path.join(context.root, "extra-output.txt")), false);
    assert.equal(await exists(path.join(context.root, "CLAUDE.md")), false);
    assert.equal(await exists(path.join(context.root, ".amarax", "ai-rules-manifest.json")), false);
  } finally {
    await context.dispose();
  }
});
