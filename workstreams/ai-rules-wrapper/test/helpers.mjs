import assert from "node:assert/strict";
import { lstat, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configDefaults, WrapperError } from "../src/wrapper.mjs";

const fixtureCompiler = fileURLToPath(
  new URL("./fixtures/fake-compiler.mjs", import.meta.url),
);

export async function exists(target) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export async function createFixture({ plainCredential = false, compilerEnv = {} } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "amarax-ai-rules-wrapper-test-"));
  await mkdir(path.join(root, "ai-rules"), { recursive: true });
  await writeFile(
    path.join(root, "ai-rules", "platform.md"),
    "# Platform Rules\nUse evidence-first implementation.\n",
    "utf8",
  );
  const referenceValue = plainCredential ? "plain-value" : "${EVIDENCE_REF}";
  const mcp = {
    mcpServers: {
      evidence: {
        command: "echo",
        args: ["ready"],
        env: { EVIDENCE_REF: referenceValue },
      },
    },
  };
  await writeFile(
    path.join(root, "ai-rules", "mcp.json"),
    `${JSON.stringify(mcp, null, 2)}\n`,
    "utf8",
  );
  const config = {
    ...configDefaults(),
    binary: process.execPath,
    binaryArgs: [fixtureCompiler],
    agents: ["claude", "codex", "cursor"],
    compilerEnv,
  };
  return {
    root,
    config,
    dispose: () => rm(root, { recursive: true, force: true }),
  };
}

export async function expectWrapperError(promise, code) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof WrapperError);
    assert.equal(error.code, code);
    return true;
  });
}
