import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { execute } from "../src/adapter.mjs";
import { createFixture, exists } from "./helpers.mjs";

async function withEnvironment(values, callback) {
  const previous = new Map();
  for (const [name, value] of Object.entries(values)) {
    previous.set(name, process.env[name]);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  try {
    return await callback();
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("successful execution preserves argv, emits events, and redacts resolved values", { concurrency: false }, async () => {
  const context = await createFixture();
  const record = path.join(context.root, "provider-argv.json");
  const events = [];
  try {
    const result = await withEnvironment(
      {
        FAKE_TQ_RECORD: record,
        FAKE_TQ_STDOUT: "stdout sensitive-demo-value\n",
        FAKE_TQ_STDERR: "stderr sensitive-demo-value\n",
        FAKE_TQ_EXIT_CODE: "0",
      },
      () => execute({
        root: context.root,
        config: context.config,
        request: context.request,
        environmentSource: context.environmentSource,
        onEvent: (event) => events.push(event),
      }),
    );

    assert.equal(result.status, "succeeded");
    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /stdout \[REDACTED\]/);
    assert.match(result.stderr, /stderr \[REDACTED\]/);
    assert.equal(JSON.stringify(result).includes("sensitive-demo-value"), false);
    assert.equal(JSON.stringify(events).includes("sensitive-demo-value"), false);

    const recordPayload = JSON.parse(await readFile(record, "utf8"));
    const argv = recordPayload.argv;
    assert.ok(argv.includes("--data-dir"));
    assert.ok(argv.includes("run"));
    assert.ok(argv.includes("-q"));
    assert.ok(argv.includes("build"));
    assert.ok(argv.includes("-C"));
    assert.ok(argv.includes(path.resolve(context.workspace)));
    assert.ok(argv.includes("DEMO_OUTPUT=sensitive-demo-value"));
    assert.ok(argv.includes("node"));
    assert.ok(argv.includes("script.mjs"));
    assert.ok(argv.includes("literal;not-shell"));

    const eventTypes = events.map((event) => event.type);
    assert.deepEqual(eventTypes.slice(0, 3), ["admitted", "queued", "started"]);
    assert.ok(eventTypes.includes("stdout"));
    assert.ok(eventTypes.includes("stderr"));
    assert.equal(eventTypes.at(-1), "completed");
  } finally {
    await context.dispose();
  }
});

test("provider exit code 124 is normalized as timed_out", { concurrency: false }, async () => {
  const context = await createFixture();
  try {
    const result = await withEnvironment(
      {
        FAKE_TQ_EXIT_CODE: "124",
        FAKE_TQ_STDERR: "provider timeout\n",
      },
      () => execute({
        root: context.root,
        config: context.config,
        request: context.request,
        environmentSource: context.environmentSource,
      }),
    );
    assert.equal(result.status, "timed_out");
    assert.equal(result.exitCode, 124);
  } finally {
    await context.dispose();
  }
});

test("AbortSignal cancels a ready provider and records cancellation events", { concurrency: false }, async () => {
  const context = await createFixture();
  const controller = new AbortController();
  const terminationRecord = path.join(context.root, "provider-terminated.txt");
  const events = [];
  try {
    const result = await withEnvironment(
      {
        FAKE_TQ_SLEEP_MS: "10000",
        FAKE_TQ_STDOUT: "provider-ready\n",
        FAKE_TQ_TERMINATION_RECORD: terminationRecord,
      },
      () => execute({
        root: context.root,
        config: context.config,
        request: context.request,
        environmentSource: context.environmentSource,
        signal: controller.signal,
        onEvent: (event) => {
          events.push(event);
          if (event.type === "stdout" && event.payload.text.includes("provider-ready")) {
            controller.abort();
          }
        },
      }),
    );
    assert.equal(result.status, "cancelled");
    assert.ok(events.some((event) => event.type === "cancellation_requested"));
    assert.equal(events.at(-1).type, "completed");
    assert.equal(await exists(terminationRecord), true);
  } finally {
    await context.dispose();
  }
});

test("an already-aborted request returns without spawning the provider", { concurrency: false }, async () => {
  const context = await createFixture();
  const controller = new AbortController();
  const record = path.join(context.root, "should-not-exist.json");
  controller.abort();
  try {
    const result = await withEnvironment(
      { FAKE_TQ_RECORD: record },
      () => execute({
        root: context.root,
        config: context.config,
        request: context.request,
        environmentSource: context.environmentSource,
        signal: controller.signal,
      }),
    );
    assert.equal(result.status, "cancelled");
    assert.equal(await exists(record), false);
  } finally {
    await context.dispose();
  }
});
