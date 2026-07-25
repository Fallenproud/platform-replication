import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  readlink,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_CONFIG = Object.freeze({
  binary: "ai-rules",
  binaryArgs: [],
  agents: [],
  sourceDir: "ai-rules",
  manifestPath: ".amarax/ai-rules-manifest.json",
  allowedOutputs: [
    "CLAUDE.md",
    "AGENTS.md",
    ".mcp.json",
    ".codex/**",
    ".cursor/**",
    ".goosehints",
    "ai-rules/.generated-ai-rules/**",
  ],
  ignoredPaths: [".git/**", ".amarax/**", "node_modules/**"],
  compilerEnv: {},
  timeoutMs: 120_000,
});

const SECRET_KEY_PATTERN = /(token|secret|password|credential|api[_-]?key)/i;
const SECRET_REFERENCE_PATTERN = /^\$\{(?:env:)?[A-Za-z_][A-Za-z0-9_]*\}$/;

export class WrapperError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = "WrapperError";
    this.code = code;
    this.details = details;
  }
}

function normalizeRelative(value, label = "path") {
  if (typeof value !== "string" || value.trim() === "") {
    throw new WrapperError("invalid_config", `${label} must be a non-empty string`);
  }
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (path.posix.isAbsolute(normalized) || normalized === ".." || normalized.startsWith("../")) {
    throw new WrapperError("path_escape", `${label} must remain inside the repository: ${value}`);
  }
  return normalized.replace(/\/$/, "");
}

function matchesPattern(relativePath, pattern) {
  const candidate = normalizeRelative(relativePath, "candidate path");
  const rule = normalizeRelative(pattern, "path pattern");
  if (rule.endsWith("/**")) {
    const prefix = rule.slice(0, -3).replace(/\/$/, "");
    return candidate === prefix || candidate.startsWith(`${prefix}/`);
  }
  if (rule.endsWith("/*")) {
    const prefix = rule.slice(0, -2).replace(/\/$/, "");
    if (!candidate.startsWith(`${prefix}/`)) return false;
    return !candidate.slice(prefix.length + 1).includes("/");
  }
  return candidate === rule;
}

function matchesAny(relativePath, patterns) {
  return patterns.some((pattern) => matchesPattern(relativePath, pattern));
}

function resolveInside(root, relativePath) {
  const normalized = normalizeRelative(relativePath);
  const resolved = path.resolve(root, normalized);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(`${rootResolved}${path.sep}`)) {
    throw new WrapperError("path_escape", `Path escaped repository root: ${relativePath}`);
  }
  return resolved;
}

async function pathExists(target) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function hashFile(target) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(target)) digest.update(chunk);
  return digest.digest("hex");
}

async function fileState(root, relativePath) {
  const target = resolveInside(root, relativePath);
  let stat;
  try {
    stat = await lstat(target);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
  if (stat.isSymbolicLink()) {
    return { type: "symlink", target: await readlink(target) };
  }
  if (stat.isFile()) {
    return { type: "file", digest: await hashFile(target), mode: stat.mode & 0o777 };
  }
  return null;
}

async function walk(root, ignoredPatterns, current = "", result = new Map()) {
  const directory = current ? resolveInside(root, current) : root;
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return result;
    throw error;
  }
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const relativePath = current ? `${current}/${entry.name}` : entry.name;
    if (matchesAny(relativePath, ignoredPatterns)) continue;
    const target = resolveInside(root, relativePath);
    const stat = await lstat(target);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      await walk(root, ignoredPatterns, relativePath, result);
      continue;
    }
    const state = await fileState(root, relativePath);
    if (state) result.set(relativePath, state);
  }
  return result;
}

async function copyTree(sourceRoot, destinationRoot, ignoredPatterns, current = "") {
  const sourceDirectory = current ? resolveInside(sourceRoot, current) : sourceRoot;
  await mkdir(current ? resolveInside(destinationRoot, current) : destinationRoot, { recursive: true });
  const entries = await readdir(sourceDirectory, { withFileTypes: true });
  for (const entry of entries) {
    const relativePath = current ? `${current}/${entry.name}` : entry.name;
    if (matchesAny(relativePath, ignoredPatterns)) continue;
    const source = resolveInside(sourceRoot, relativePath);
    const destination = resolveInside(destinationRoot, relativePath);
    const stat = await lstat(source);
    if (stat.isSymbolicLink()) {
      await mkdir(path.dirname(destination), { recursive: true });
      await symlink(await readlink(source), destination);
    } else if (stat.isDirectory()) {
      await copyTree(sourceRoot, destinationRoot, ignoredPatterns, relativePath);
    } else if (stat.isFile()) {
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(source, destination);
      await chmod(destination, stat.mode & 0o777);
    }
  }
}

function statesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function diffSnapshots(before, after) {
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  return paths
    .filter((relativePath) => !statesEqual(before.get(relativePath) ?? null, after.get(relativePath) ?? null))
    .map((relativePath) => ({
      path: relativePath,
      before: before.get(relativePath) ?? null,
      after: after.get(relativePath) ?? null,
      operation: !before.has(relativePath) ? "create" : !after.has(relativePath) ? "delete" : "replace",
    }));
}

function stableDigest(records) {
  const digest = createHash("sha256");
  for (const [relativePath, state] of [...records.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    digest.update(relativePath);
    digest.update("\0");
    digest.update(JSON.stringify(state));
    digest.update("\n");
  }
  return digest.digest("hex");
}

async function sourceDigest(root, config) {
  const sourceRoot = resolveInside(root, config.sourceDir);
  const ignored = [
    ...config.ignoredPaths,
    ".generated-ai-rules/**",
  ];
  const records = await walk(sourceRoot, ignored);
  return stableDigest(records);
}

function validateSecretValue(value, location) {
  if (typeof value !== "string" || !SECRET_REFERENCE_PATTERN.test(value)) {
    throw new WrapperError(
      "literal_secret",
      `MCP secret at ${location} must be an environment reference such as \${API_TOKEN}`,
    );
  }
}

function scanSensitiveFields(value, location = "mcp") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanSensitiveFields(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const childLocation = `${location}.${key}`;
    if (key === "env" && child && typeof child === "object" && !Array.isArray(child)) {
      for (const [envName, envValue] of Object.entries(child)) {
        validateSecretValue(envValue, `${childLocation}.${envName}`);
      }
      continue;
    }
    if (SECRET_KEY_PATTERN.test(key) && typeof child === "string") {
      validateSecretValue(child, childLocation);
      continue;
    }
    scanSensitiveFields(child, childLocation);
  }
}

async function validateMcpSecrets(root, config) {
  const mcpPath = resolveInside(root, `${config.sourceDir}/mcp.json`);
  if (!(await pathExists(mcpPath))) return;
  let parsed;
  try {
    parsed = JSON.parse(await readFile(mcpPath, "utf8"));
  } catch (error) {
    throw new WrapperError("invalid_mcp_json", `Unable to parse ${config.sourceDir}/mcp.json`, String(error));
  }
  scanSensitiveFields(parsed);
}

function resolveBinary(root, binary) {
  if (path.isAbsolute(binary)) return binary;
  if (binary.includes("/") || binary.includes("\\")) return path.resolve(root, binary);
  return binary;
}

async function runProcess(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2_000).unref();
    }, options.timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new WrapperError("compiler_spawn_failed", `Unable to start compiler: ${error.message}`));
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ code, signal, stdout, stderr });
      } else {
        reject(new WrapperError("compiler_failed", `Compiler exited with code ${code ?? "null"}`, {
          code,
          signal,
          stdout,
          stderr,
        }));
      }
    });
  });
}

async function loadManifest(root, config, required = false) {
  const manifestPath = resolveInside(root, config.manifestPath);
  if (!(await pathExists(manifestPath))) {
    if (required) throw new WrapperError("manifest_missing", `Manifest not found: ${config.manifestPath}`);
    return null;
  }
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.outputs)) {
    throw new WrapperError("manifest_invalid", `Invalid manifest: ${config.manifestPath}`);
  }
  return manifest;
}

async function writeJsonAtomic(target, value) {
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, target);
}

function validateChangedPaths(changes, config) {
  const unexpected = changes.filter((change) => !matchesAny(change.path, config.allowedOutputs));
  if (unexpected.length) {
    throw new WrapperError("unexpected_output", "Compiler changed paths outside allowedOutputs", unexpected);
  }
}

function validateGeneratedSymlink(stageRoot, relativePath, state) {
  if (state?.type !== "symlink") return;
  if (path.isAbsolute(state.target)) {
    throw new WrapperError("unsafe_symlink", `Generated symlink is absolute: ${relativePath} -> ${state.target}`);
  }
  const linkPath = resolveInside(stageRoot, relativePath);
  const resolvedTarget = path.resolve(path.dirname(linkPath), state.target);
  const rootResolved = path.resolve(stageRoot);
  if (resolvedTarget !== rootResolved && !resolvedTarget.startsWith(`${rootResolved}${path.sep}`)) {
    throw new WrapperError("unsafe_symlink", `Generated symlink escapes repository: ${relativePath} -> ${state.target}`);
  }
}

async function copyEntry(stageRoot, realRoot, relativePath, state) {
  const source = resolveInside(stageRoot, relativePath);
  const destination = resolveInside(realRoot, relativePath);
  await rm(destination, { recursive: true, force: true });
  if (!state) return;
  await mkdir(path.dirname(destination), { recursive: true });
  if (state.type === "symlink") {
    validateGeneratedSymlink(stageRoot, relativePath, state);
    await symlink(state.target, destination);
  } else if (state.type === "file") {
    await copyFile(source, destination);
    await chmod(destination, state.mode);
  }
}

function normalizeConfig(raw) {
  const config = { ...DEFAULT_CONFIG, ...raw };
  if (!Array.isArray(config.binaryArgs) || !config.binaryArgs.every((value) => typeof value === "string")) {
    throw new WrapperError("invalid_config", "binaryArgs must be an array of strings");
  }
  if (!Array.isArray(config.agents) || !config.agents.every((value) => typeof value === "string" && value)) {
    throw new WrapperError("invalid_config", "agents must be an array of non-empty strings");
  }
  if (!Array.isArray(config.allowedOutputs) || config.allowedOutputs.length === 0) {
    throw new WrapperError("invalid_config", "allowedOutputs must contain at least one path");
  }
  if (!Array.isArray(config.ignoredPaths)) {
    throw new WrapperError("invalid_config", "ignoredPaths must be an array");
  }
  config.sourceDir = normalizeRelative(config.sourceDir, "sourceDir");
  config.manifestPath = normalizeRelative(config.manifestPath, "manifestPath");
  config.allowedOutputs = config.allowedOutputs.map((value) => normalizeRelative(value, "allowed output"));
  config.ignoredPaths = config.ignoredPaths.map((value) => normalizeRelative(value, "ignored path"));
  config.timeoutMs = Number(config.timeoutMs);
  if (!Number.isFinite(config.timeoutMs) || config.timeoutMs < 1_000) {
    throw new WrapperError("invalid_config", "timeoutMs must be at least 1000");
  }
  return config;
}

export async function loadConfig(root, configPath) {
  const target = resolveInside(root, configPath);
  const raw = JSON.parse(await readFile(target, "utf8"));
  return normalizeConfig(raw);
}

export async function generate({ root, config, dryRun = false }) {
  const repositoryRoot = path.resolve(root);
  await validateMcpSecrets(repositoryRoot, config);
  const previousManifest = await loadManifest(repositoryRoot, config, false);
  const before = await walk(repositoryRoot, config.ignoredPaths);
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "amarax-ai-rules-"));
  const stageRoot = path.join(temporaryRoot, "repository");

  try {
    await copyTree(repositoryRoot, stageRoot, config.ignoredPaths);
    const command = resolveBinary(repositoryRoot, config.binary);
    const args = [
      ...config.binaryArgs,
      "generate",
      ...(config.agents.length ? ["--agents", config.agents.join(",")] : []),
    ];
    const compilerResult = await runProcess(command, args, {
      cwd: stageRoot,
      env: { ...process.env, ...config.compilerEnv },
      timeoutMs: config.timeoutMs,
    });
    const after = await walk(stageRoot, config.ignoredPaths);
    const changes = diffSnapshots(before, after);
    validateChangedPaths(changes, config);
    for (const change of changes) validateGeneratedSymlink(stageRoot, change.path, change.after);

    const previousPaths = new Set(previousManifest?.outputs?.map((output) => output.path) ?? []);
    const managedPaths = new Set();
    for (const change of changes) {
      if (change.after && matchesAny(change.path, config.allowedOutputs)) managedPaths.add(change.path);
    }
    for (const relativePath of previousPaths) {
      if (after.has(relativePath) && matchesAny(relativePath, config.allowedOutputs)) managedPaths.add(relativePath);
    }

    let compilerVersion = "unknown";
    try {
      const versionResult = await runProcess(command, [...config.binaryArgs, "--version"], {
        cwd: stageRoot,
        env: { ...process.env, ...config.compilerEnv },
        timeoutMs: Math.min(config.timeoutMs, 30_000),
      });
      compilerVersion = versionResult.stdout.trim() || versionResult.stderr.trim() || "unknown";
    } catch {
      compilerVersion = "unknown";
    }

    const outputs = [];
    for (const relativePath of [...managedPaths].sort()) {
      const state = after.get(relativePath);
      if (state) outputs.push({ path: relativePath, ...state });
    }
    const manifest = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      compiler: {
        binary: config.binary,
        binaryArgs: config.binaryArgs,
        version: compilerVersion,
      },
      agents: config.agents,
      sourceDir: config.sourceDir,
      sourceDigest: await sourceDigest(stageRoot, config),
      outputs,
      observedChanges: changes.map(({ path: relativePath, operation }) => ({ path: relativePath, operation })),
    };

    if (!dryRun) {
      for (const change of changes) await copyEntry(stageRoot, repositoryRoot, change.path, change.after);
      await writeJsonAtomic(resolveInside(repositoryRoot, config.manifestPath), manifest);
    }

    return {
      dryRun,
      compiler: manifest.compiler,
      changes: manifest.observedChanges,
      outputCount: outputs.length,
      stdout: compilerResult.stdout,
      stderr: compilerResult.stderr,
      manifest: dryRun ? manifest : config.manifestPath,
    };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function verify({ root, config }) {
  const repositoryRoot = path.resolve(root);
  const manifest = await loadManifest(repositoryRoot, config, true);
  const failures = [];
  const currentSourceDigest = await sourceDigest(repositoryRoot, config);
  if (currentSourceDigest !== manifest.sourceDigest) {
    failures.push({ type: "source_drift", expected: manifest.sourceDigest, actual: currentSourceDigest });
  }
  for (const output of manifest.outputs) {
    if (!matchesAny(output.path, config.allowedOutputs)) {
      failures.push({ type: "manifest_path_not_allowed", path: output.path });
      continue;
    }
    const current = await fileState(repositoryRoot, output.path);
    const expected = { ...output };
    delete expected.path;
    if (!statesEqual(current, expected)) {
      failures.push({ type: "output_drift", path: output.path, expected, actual: current });
    }
  }
  if (failures.length) {
    throw new WrapperError("verification_failed", "AI Rules source or outputs have drifted", failures);
  }
  return {
    verified: true,
    sourceDigest: currentSourceDigest,
    outputCount: manifest.outputs.length,
    compiler: manifest.compiler,
  };
}

export async function clean({ root, config, force = false }) {
  const repositoryRoot = path.resolve(root);
  const manifest = await loadManifest(repositoryRoot, config, true);
  if (!force) await verify({ root: repositoryRoot, config });
  const removed = [];
  for (const output of [...manifest.outputs].sort((left, right) => right.path.length - left.path.length)) {
    if (!matchesAny(output.path, config.allowedOutputs)) {
      throw new WrapperError("manifest_path_not_allowed", `Manifest path is not allowed: ${output.path}`);
    }
    await rm(resolveInside(repositoryRoot, output.path), { recursive: true, force: true });
    removed.push(output.path);
  }
  await rm(resolveInside(repositoryRoot, config.manifestPath), { force: true });
  return { cleaned: true, forced: force, removed };
}

export function configDefaults() {
  return structuredClone(DEFAULT_CONFIG);
}
