#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { AdapterError, dryRun, execute, loadConfig } from "./adapter.mjs";

function usage() {
  return `Amarax Guarded Task Adapter

Usage:
  node src/cli.mjs dry-run --root PATH --config FILE --request FILE
  node src/cli.mjs execute --root PATH --config FILE --request FILE [--events]
`;
}

function parse(argv) {
  const [command, ...rest] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    return { command: "help" };
  }
  if (!["dry-run", "execute"].includes(command)) {
    throw new AdapterError("invalid_command", `Unknown command: ${command}`);
  }
  const options = {
    command,
    root: process.cwd(),
    configPath: null,
    requestPath: null,
    events: false,
  };
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument === "--root") {
      const value = rest[++index];
      if (!value) throw new AdapterError("invalid_argument", "--root requires a value");
      options.root = path.resolve(value);
    } else if (argument === "--config") {
      options.configPath = rest[++index] ?? null;
    } else if (argument === "--request") {
      options.requestPath = rest[++index] ?? null;
    } else if (argument === "--events" && command === "execute") {
      options.events = true;
    } else {
      throw new AdapterError("invalid_argument", `Unsupported argument: ${argument}`);
    }
  }
  if (!options.configPath || !options.requestPath) {
    throw new AdapterError("invalid_argument", "--config and --request are required");
  }
  return options;
}

async function readJson(root, relativeOrAbsolute) {
  const target = path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.resolve(root, relativeOrAbsolute);
  return JSON.parse(await readFile(target, "utf8"));
}

async function main() {
  const options = parse(process.argv.slice(2));
  if (options.command === "help") {
    process.stdout.write(usage());
    return;
  }
  const config = await loadConfig(options.root, options.configPath);
  const request = await readJson(options.root, options.requestPath);
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const result = options.command === "dry-run"
      ? await dryRun({ root: options.root, config, request })
      : await execute({
          root: options.root,
          config,
          request,
          signal: controller.signal,
          onEvent: options.events
            ? (event) => process.stderr.write(`${JSON.stringify(event)}\n`)
            : undefined,
        });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    process.removeListener("SIGINT", cancel);
    process.removeListener("SIGTERM", cancel);
  }
}

main().catch((error) => {
  const body = error instanceof AdapterError
    ? { error: error.code, message: error.message, details: error.details }
    : { error: "unexpected", message: error?.message ?? String(error) };
  process.stderr.write(`${JSON.stringify(body, null, 2)}\n`);
  process.exitCode = 1;
});
