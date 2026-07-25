import assert from "node:assert/strict";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { clean, generate, verify } from "../src/wrapper.mjs";
import { createFixture, exists, expectWrapperError } from "./helpers.mjs";

test("dry-run reports staged changes without mutating the repository", async () => {
  const context = await createFixture();
  try {
    const result = await generate({ root: context.root, config: context.config, dryRun: true });
    assert.equal(result.dryRun, true);
    assert.ok(result.changes.length >= 6);
    assert.equal(await exists(path.join(context.root, "CLAUDE.md")), false);
    assert.equal(await exists(path.join(context.root, ".amarax", "ai-rules-manifest.json")), false);
  } finally {
    await context.dispose();
  }
});

test("generate, verify, regenerate, and clean operate from the manifest", async () => {
  const context = await createFixture();
  try {
    const generated = await generate({ root: context.root, config: context.config });
    assert.equal(generated.dryRun, false);
    assert.equal(
      await readFile(path.join(context.root, "CLAUDE.md"), "utf8"),
      "# Generated Rules\nPreserve provenance.\n",
    );
    assert.equal((await lstat(path.join(context.root, "CLAUDE.md"))).isSymbolicLink(), true);
    assert.equal(await exists(path.join(context.root, ".amarax", "ai-rules-manifest.json")), true);

    const verified = await verify({ root: context.root, config: context.config });
    assert.equal(verified.verified, true);
    assert.ok(verified.outputCount >= 6);

    const generatedTarget = path.join(
      context.root,
      "ai-rules",
      ".generated-ai-rules",
      "ai-rules-generated-AGENTS.md",
    );
    await writeFile(generatedTarget, "drift\n", "utf8");
    await expectWrapperError(
      verify({ root: context.root, config: context.config }),
      "verification_failed",
    );

    await generate({ root: context.root, config: context.config });
    assert.equal((await verify({ root: context.root, config: context.config })).verified, true);

    const cleaned = await clean({ root: context.root, config: context.config });
    assert.equal(cleaned.cleaned, true);
    assert.equal(await exists(path.join(context.root, "CLAUDE.md")), false);
    assert.equal(await exists(path.join(context.root, "AGENTS.md")), false);
    assert.equal(await exists(path.join(context.root, ".amarax", "ai-rules-manifest.json")), false);
    assert.equal(await exists(path.join(context.root, "ai-rules", "platform.md")), true);
  } finally {
    await context.dispose();
  }
});

test("source changes invalidate the manifest", async () => {
  const context = await createFixture();
  try {
    await generate({ root: context.root, config: context.config });
    await writeFile(path.join(context.root, "ai-rules", "platform.md"), "changed source\n", "utf8");
    await expectWrapperError(
      verify({ root: context.root, config: context.config }),
      "verification_failed",
    );
  } finally {
    await context.dispose();
  }
});
