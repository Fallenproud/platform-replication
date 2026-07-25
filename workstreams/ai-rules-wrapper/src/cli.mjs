#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { clean, generate, loadConfig, verify, WrapperError } from "./wrapper.mjs";

function usage() {
  return `Amarax AI Rules Wrapper

Usage:
  node src/cli.mjs generate [--dry-run] [--root PATH] [--config PATH]
  node src/cli.mjs verify [--root PATH] [--config PATH]
  node src/cli.mjs clean [--force] [--root PATH] [--config PATH]

Defaults:
  --root    current working directory
  --config  ai-rules.wrapper.json (relative to root)
`;
}

function parse(argv) {
  const [command, ...rest] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    return { command: "help" };
  }
  if (!["generate", "verify", "clean"].includes(command)) {
    throw new WrapperError("invalid_command", `Unknown command: ${command}`);
  }
  const options = {
    command,
    root: process.cwd(),
    configPath: "ai-rules.wrapper.json",
    dryRun: false,
    force: false,
  };
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument === "--root") {
      const value = rest[++index];
      if (!value) throw new WrapperError("invalid_argument", "--root requires a value");
      options.root = path.resolve(value);
    } else if (argument === "--config") {
      const value = rest[++index];
      if (!value) throw new WrapperError("invalid_argument", "--config requires a value");
      options.configPath = value;
    } else if (argument === "--dry-run" && command === "generate") {
      options.dryRun = true;
    } else if (argument === "--force" && command === "clean") {
      options.force = true;
    } else {
      throw new WrapperError("invalid_argument", `Unsupported argument for ${command}: ${argument}`);
    }
  }
  return options;
}

async function main() {
  const options = parse(process.argv.slice(2));
  if (options.command === "help") {
    process.stdout.write(usage());
    return;
  }
  const config = await loadConfig(options.root, options.configPath);
  let result;
  if (options.command === "generate") {
    result = await generate({ root: options.root, config, dryRun: options.dryRun });
  } else if (options.command === "verify") {
    result = await verify({ root: options.root, config });
  } else {
    result = await clean({ root: options.root, config, force: options.force });
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  const body = error instanceof WrapperError
    ? { error: error.code, message: error.message, details: error.details }
    : { error: "unexpected", message: error?.message ?? String(error) };
  process.stderr.write(`${JSON.stringify(body, null, 2)}\n`);
  process.exitCode = 1;
});
