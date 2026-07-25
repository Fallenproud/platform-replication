import path from "node:path";
import test from "node:test";
import { dryRun, prepare } from "../src/adapter.mjs";
import { createFixture, expectAdapterError } from "./helpers.mjs";

test("missing, denied, and expired policy decisions are rejected", async () => {
  const missing = await createFixture({ request: { policy: undefined } });
  try {
    await expectAdapterError(
      prepare({
        root: missing.root,
        config: missing.config,
        request: missing.request,
        environmentSource: missing.environmentSource,
      }),
      "policy_missing",
    );
  } finally {
    await missing.dispose();
  }

  const denied = await createFixture({ request: { policy: { decisionId: "policy-denied", outcome: "deny" } } });
  try {
    await expectAdapterError(
      prepare({
        root: denied.root,
        config: denied.config,
        request: denied.request,
        environmentSource: denied.environmentSource,
      }),
      "policy_denied",
    );
  } finally {
    await denied.dispose();
  }

  const expired = await createFixture({
    request: {
      policy: {
        decisionId: "policy-expired",
        outcome: "allow",
        expiresAt: "2000-01-01T00:00:00Z",
      },
    },
  });
  try {
    await expectAdapterError(
      prepare({
        root: expired.root,
        config: expired.config,
        request: expired.request,
        environmentSource: expired.environmentSource,
      }),
      "policy_expired",
    );
  } finally {
    await expired.dispose();
  }
});

test("workspace, executable, queue, timeout, and environment boundaries are enforced", async () => {
  const context = await createFixture();
  try {
    await expectAdapterError(
      prepare({
        root: context.root,
        config: context.config,
        request: { ...context.request, workingDirectory: context.outside },
        environmentSource: context.environmentSource,
      }),
      "workspace_denied",
    );

    await expectAdapterError(
      prepare({
        root: context.root,
        config: context.config,
        request: { ...context.request, executable: "bash" },
        environmentSource: context.environmentSource,
      }),
      "executable_denied",
    );

    await expectAdapterError(
      prepare({
        root: context.root,
        config: context.config,
        request: { ...context.request, executable: "./node" },
        environmentSource: context.environmentSource,
      }),
      "executable_denied",
    );

    await expectAdapterError(
      prepare({
        root: context.root,
        config: context.config,
        request: { ...context.request, queueName: "bad queue" },
        environmentSource: context.environmentSource,
      }),
      "queue_denied",
    );

    await expectAdapterError(
      prepare({
        root: context.root,
        config: context.config,
        request: { ...context.request, timeoutSeconds: 60 },
        environmentSource: context.environmentSource,
      }),
      "timeout_denied",
    );

    await expectAdapterError(
      prepare({
        root: context.root,
        config: context.config,
        request: {
          ...context.request,
          environmentReferences: { DEMO_OUTPUT: "NOT_APPROVED" },
        },
        environmentSource: context.environmentSource,
      }),
      "environment_reference_denied",
    );

    await expectAdapterError(
      prepare({
        root: context.root,
        config: context.config,
        request: context.request,
        environmentSource: {},
      }),
      "environment_reference_missing",
    );
  } finally {
    await context.dispose();
  }
});

test("dry-run exposes references and structured arguments without revealing resolved values", async () => {
  const context = await createFixture();
  try {
    const result = await dryRun({
      root: context.root,
      config: context.config,
      request: context.request,
      environmentSource: context.environmentSource,
    });
    const serialized = JSON.stringify(result);
    if (serialized.includes(context.environmentSource.DEMO_REF)) {
      throw new Error("dry-run leaked resolved environment value");
    }
    if (!serialized.includes("${DEMO_REF}")) {
      throw new Error("dry-run omitted environment reference");
    }
    if (!result.arguments.includes("literal;not-shell")) {
      throw new Error("structured argument was not preserved");
    }
    if (result.workingDirectory !== path.resolve(context.workspace)) {
      throw new Error("working directory was not resolved canonically");
    }
  } finally {
    await context.dispose();
  }
});
