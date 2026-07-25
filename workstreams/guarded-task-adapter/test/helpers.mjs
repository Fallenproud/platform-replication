import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AdapterError, configDefaults } from "../src/adapter.mjs";

const fakeProvider = fileURLToPath(
  new URL("./fixtures/fake-tq.mjs", import.meta.url),
);

export async function createFixture(overrides = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "amarax-guarded-task-test-"));
  const workspace = path.join(root, "workspace");
  const outside = await mkdtemp(path.join(tmpdir(), "amarax-guarded-task-outside-"));
  await mkdir(workspace, { recursive: true });
  await writeFile(path.join(workspace, "input.txt"), "fixture\n", "utf8");

  const config = {
    ...configDefaults(),
    tqBinary: process.execPath,
    tqArgs: [fakeProvider],
    dataDir: ".amarax/task-queue",
    allowedExecutables: ["node", "python"],
    allowedWorkspaceRoots: ["workspace"],
    allowedEnvironmentReferences: ["DEMO_REF", "CI"],
    maxTimeoutSeconds: 30,
    ...overrides.config,
  };

  const request = {
    requestId: "request-001",
    correlationId: "correlation-001",
    actor: {
      actorId: "agent-builder",
      actorType: "agent",
      organizationId: "organization-001",
      projectId: "project-001",
      environmentId: "development",
    },
    policy: {
      decisionId: "policy-001",
      outcome: "allow",
      expiresAt: "2099-01-01T00:00:00Z",
    },
    queueName: "build",
    executable: "node",
    args: ["script.mjs", "literal;not-shell"],
    workingDirectory: "workspace",
    environmentReferences: { DEMO_OUTPUT: "DEMO_REF" },
    timeoutSeconds: 10,
    ...overrides.request,
  };

  return {
    root,
    workspace,
    outside,
    config,
    request,
    environmentSource: {
      DEMO_REF: "sensitive-demo-value",
      CI: "true",
    },
    dispose: async () => {
      await rm(root, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    },
  };
}

export async function expectAdapterError(promise, code) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof AdapterError);
    assert.equal(error.code, code);
    return true;
  });
}
