import { randomUUID } from "node:crypto";
import { mkdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_CONFIG = Object.freeze({
  tqBinary: "tq",
  tqArgs: [],
  dataDir: ".amarax/task-queue",
  allowedExecutables: [],
  allowedWorkspaceRoots: ["."],
  allowedEnvironmentReferences: [],
  maxTimeoutSeconds: 900,
  queuePattern: "^[A-Za-z0-9._:-]{1,80}$",
  terminationGraceMs: 2_000,
});

const IDENTIFIER_FIELDS = [
  "requestId",
  "correlationId",
];

const ACTOR_FIELDS = [
  "actorId",
  "actorType",
  "organizationId",
  "projectId",
  "environmentId",
];

export class AdapterError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = "AdapterError";
    this.code = code;
    this.details = details;
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AdapterError("invalid_request", `${label} must be a non-empty string`);
  }
  if (value.includes("\0")) {
    throw new AdapterError("invalid_request", `${label} may not contain a NUL byte`);
  }
  return value;
}

function resolveConfiguredPath(root, value, label) {
  requireString(value, label);
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(root, value);
}

function isInside(candidate, allowedRoot) {
  return candidate === allowedRoot || candidate.startsWith(`${allowedRoot}${path.sep}`);
}

function resolveBinary(root, binary) {
  if (path.isAbsolute(binary)) return binary;
  if (binary.includes("/") || binary.includes("\\")) return path.resolve(root, binary);
  return binary;
}

function normalizeConfig(raw) {
  const config = { ...DEFAULT_CONFIG, ...raw };
  for (const field of ["tqArgs", "allowedExecutables", "allowedWorkspaceRoots", "allowedEnvironmentReferences"]) {
    if (!Array.isArray(config[field]) || !config[field].every((value) => typeof value === "string" && value)) {
      throw new AdapterError("invalid_config", `${field} must be an array of non-empty strings`);
    }
  }
  if (config.allowedExecutables.length === 0) {
    throw new AdapterError("invalid_config", "allowedExecutables must not be empty");
  }
  if (config.allowedWorkspaceRoots.length === 0) {
    throw new AdapterError("invalid_config", "allowedWorkspaceRoots must not be empty");
  }
  config.maxTimeoutSeconds = Number(config.maxTimeoutSeconds);
  config.terminationGraceMs = Number(config.terminationGraceMs);
  if (!Number.isFinite(config.maxTimeoutSeconds) || config.maxTimeoutSeconds < 1) {
    throw new AdapterError("invalid_config", "maxTimeoutSeconds must be at least 1");
  }
  if (!Number.isFinite(config.terminationGraceMs) || config.terminationGraceMs < 0) {
    throw new AdapterError("invalid_config", "terminationGraceMs must be zero or greater");
  }
  try {
    config.queueRegex = new RegExp(config.queuePattern);
  } catch (error) {
    throw new AdapterError("invalid_config", `Invalid queuePattern: ${error.message}`);
  }
  return config;
}

export async function loadConfig(root, configPath) {
  const target = resolveConfiguredPath(root, configPath, "config path");
  const parsed = JSON.parse(await readFile(target, "utf8"));
  return normalizeConfig(parsed);
}

async function validateWorkspace(root, config, requestedDirectory) {
  const requested = resolveConfiguredPath(root, requestedDirectory, "workingDirectory");
  let resolvedRequested;
  try {
    resolvedRequested = await realpath(requested);
  } catch (error) {
    throw new AdapterError("workspace_missing", `Working directory does not exist: ${requested}`, String(error));
  }
  const allowedRoots = [];
  for (const configuredRoot of config.allowedWorkspaceRoots) {
    const candidate = resolveConfiguredPath(root, configuredRoot, "allowed workspace root");
    try {
      allowedRoots.push(await realpath(candidate));
    } catch (error) {
      throw new AdapterError("invalid_config", `Allowed workspace root does not exist: ${candidate}`, String(error));
    }
  }
  if (!allowedRoots.some((allowedRoot) => isInside(resolvedRequested, allowedRoot))) {
    throw new AdapterError("workspace_denied", "Working directory is outside all approved workspace roots", {
      requested: resolvedRequested,
      allowedRoots,
    });
  }
  return resolvedRequested;
}

function validatePolicy(request) {
  if (!request.policy || typeof request.policy !== "object") {
    throw new AdapterError("policy_missing", "A policy decision is required");
  }
  requireString(request.policy.decisionId, "policy.decisionId");
  if (request.policy.outcome !== "allow") {
    throw new AdapterError("policy_denied", `Policy outcome is not allow: ${request.policy.outcome ?? "missing"}`);
  }
  if (request.policy.expiresAt) {
    const expiresAt = Date.parse(request.policy.expiresAt);
    if (!Number.isFinite(expiresAt)) {
      throw new AdapterError("invalid_request", "policy.expiresAt must be an ISO timestamp");
    }
    if (expiresAt <= Date.now()) {
      throw new AdapterError("policy_expired", "Policy decision has expired");
    }
  }
}

function validateActor(request) {
  if (!request.actor || typeof request.actor !== "object") {
    throw new AdapterError("actor_missing", "Actor context is required");
  }
  for (const field of ACTOR_FIELDS) requireString(request.actor[field], `actor.${field}`);
  if (!["user", "agent", "service"].includes(request.actor.actorType)) {
    throw new AdapterError("invalid_request", `Unsupported actorType: ${request.actor.actorType}`);
  }
}

function resolveEnvironment(config, request, environmentSource) {
  const references = request.environmentReferences ?? {};
  if (!references || typeof references !== "object" || Array.isArray(references)) {
    throw new AdapterError("invalid_request", "environmentReferences must be an object");
  }
  const allowed = new Set(config.allowedEnvironmentReferences);
  const resolved = [];
  for (const [outputName, referenceName] of Object.entries(references)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(outputName)) {
      throw new AdapterError("invalid_request", `Invalid output environment name: ${outputName}`);
    }
    requireString(referenceName, `environmentReferences.${outputName}`);
    if (!allowed.has(referenceName)) {
      throw new AdapterError("environment_reference_denied", `Environment reference is not approved: ${referenceName}`);
    }
    const value = environmentSource[referenceName];
    if (typeof value !== "string") {
      throw new AdapterError("environment_reference_missing", `Environment reference is unavailable: ${referenceName}`);
    }
    resolved.push({ outputName, referenceName, value });
  }
  return resolved.sort((left, right) => left.outputName.localeCompare(right.outputName));
}

function redact(text, values) {
  let redacted = text;
  for (const value of values) {
    if (!value) continue;
    redacted = redacted.split(value).join("[REDACTED]");
  }
  return redacted;
}

export async function prepare({ root, config, request, environmentSource = process.env }) {
  const repositoryRoot = path.resolve(root);
  for (const field of IDENTIFIER_FIELDS) requireString(request[field], field);
  validateActor(request);
  validatePolicy(request);

  const queueName = requireString(request.queueName, "queueName");
  if (!config.queueRegex.test(queueName)) {
    throw new AdapterError("queue_denied", `Queue name does not match queuePattern: ${queueName}`);
  }

  const executable = requireString(request.executable, "executable");
  if (executable.includes("/") || executable.includes("\\") || path.basename(executable) !== executable) {
    throw new AdapterError("executable_denied", "Executable must be an allowlisted basename, not a path");
  }
  if (!config.allowedExecutables.includes(executable)) {
    throw new AdapterError("executable_denied", `Executable is not approved: ${executable}`);
  }

  if (!Array.isArray(request.args) || !request.args.every((value) => typeof value === "string" && !value.includes("\0"))) {
    throw new AdapterError("invalid_request", "args must be an array of strings without NUL bytes");
  }

  const timeoutSeconds = Number(request.timeoutSeconds);
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > config.maxTimeoutSeconds) {
    throw new AdapterError(
      "timeout_denied",
      `timeoutSeconds must be between 1 and ${config.maxTimeoutSeconds}`,
    );
  }

  const workingDirectory = await validateWorkspace(
    repositoryRoot,
    config,
    requireString(request.workingDirectory, "workingDirectory"),
  );
  const dataDir = resolveConfiguredPath(repositoryRoot, config.dataDir, "dataDir");
  if (!isInside(dataDir, repositoryRoot)) {
    throw new AdapterError("invalid_config", "dataDir must remain inside the adapter root");
  }
  await mkdir(dataDir, { recursive: true });

  const environment = resolveEnvironment(config, request, environmentSource);
  const tqArguments = [
    ...config.tqArgs,
    "--data-dir",
    dataDir,
    "run",
    "-q",
    queueName,
    "-t",
    String(timeoutSeconds),
    "-C",
    workingDirectory,
  ];
  for (const item of environment) tqArguments.push("-e", `${item.outputName}=${item.value}`);
  tqArguments.push(executable, ...request.args);

  const displayArguments = tqArguments.map((value) => {
    for (const item of environment) {
      if (value === `${item.outputName}=${item.value}`) return `${item.outputName}=\${${item.referenceName}}`;
    }
    return value;
  });

  return {
    repositoryRoot,
    command: resolveBinary(repositoryRoot, config.tqBinary),
    arguments: tqArguments,
    displayArguments,
    workingDirectory,
    dataDir,
    timeoutSeconds,
    environment,
    request,
  };
}

function emit(onEvent, prepared, type, payload = {}) {
  const event = {
    eventId: randomUUID(),
    requestId: prepared.request.requestId,
    correlationId: prepared.request.correlationId,
    policyDecisionId: prepared.request.policy.decisionId,
    actorId: prepared.request.actor.actorId,
    projectId: prepared.request.actor.projectId,
    type,
    occurredAt: new Date().toISOString(),
    payload,
  };
  onEvent?.(event);
  return event;
}

export async function dryRun(options) {
  const prepared = await prepare(options);
  return {
    admitted: true,
    dryRun: true,
    requestId: prepared.request.requestId,
    correlationId: prepared.request.correlationId,
    policyDecisionId: prepared.request.policy.decisionId,
    provider: "agent-task-queue",
    command: prepared.command,
    arguments: prepared.displayArguments,
    workingDirectory: prepared.workingDirectory,
    dataDir: prepared.dataDir,
    timeoutSeconds: prepared.timeoutSeconds,
    environmentReferences: prepared.environment.map(({ outputName, referenceName }) => ({ outputName, referenceName })),
  };
}

export async function execute({
  root,
  config,
  request,
  environmentSource = process.env,
  signal,
  onEvent,
}) {
  const prepared = await prepare({ root, config, request, environmentSource });
  const redactionValues = prepared.environment.map((item) => item.value);
  emit(onEvent, prepared, "admitted", {
    queueName: request.queueName,
    executable: request.executable,
    workingDirectory: prepared.workingDirectory,
    timeoutSeconds: prepared.timeoutSeconds,
  });
  emit(onEvent, prepared, "queued", { provider: "agent-task-queue" });

  if (signal?.aborted) {
    emit(onEvent, prepared, "cancelled", { phase: "before_start" });
    return {
      requestId: request.requestId,
      correlationId: request.correlationId,
      policyDecisionId: request.policy.decisionId,
      status: "cancelled",
      exitCode: null,
      signal: null,
      stdout: "",
      stderr: "",
    };
  }

  return new Promise((resolve, reject) => {
    const startedAt = new Date().toISOString();
    const child = spawn(prepared.command, prepared.arguments, {
      cwd: prepared.repositoryRoot,
      env: process.env,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let cancelled = false;
    let guardTimedOut = false;

    const terminate = (reason) => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      if (reason === "cancelled") cancelled = true;
      if (reason === "guard_timeout") guardTimedOut = true;
      emit(onEvent, prepared, "cancellation_requested", { reason });
      child.kill("SIGTERM");
      setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
      }, config.terminationGraceMs).unref();
    };

    const abortHandler = () => terminate("cancelled");
    signal?.addEventListener("abort", abortHandler, { once: true });
    const guardTimer = setTimeout(
      () => terminate("guard_timeout"),
      prepared.timeoutSeconds * 1_000 + 5_000,
    );

    child.on("spawn", () => emit(onEvent, prepared, "started", { startedAt, pid: child.pid }));
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      const safe = redact(chunk, redactionValues);
      stdout += safe;
      emit(onEvent, prepared, "stdout", { text: safe });
    });
    child.stderr.on("data", (chunk) => {
      const safe = redact(chunk, redactionValues);
      stderr += safe;
      emit(onEvent, prepared, "stderr", { text: safe });
    });
    child.on("error", (error) => {
      clearTimeout(guardTimer);
      signal?.removeEventListener("abort", abortHandler);
      reject(new AdapterError("provider_spawn_failed", `Unable to start tq: ${error.message}`));
    });
    child.on("close", (exitCode, processSignal) => {
      clearTimeout(guardTimer);
      signal?.removeEventListener("abort", abortHandler);
      const completedAt = new Date().toISOString();
      const status = cancelled
        ? "cancelled"
        : guardTimedOut || exitCode === 124
          ? "timed_out"
          : exitCode === 0
            ? "succeeded"
            : "failed";
      emit(onEvent, prepared, "completed", { status, exitCode, signal: processSignal, completedAt });
      resolve({
        requestId: request.requestId,
        correlationId: request.correlationId,
        policyDecisionId: request.policy.decisionId,
        provider: "agent-task-queue",
        status,
        exitCode,
        signal: processSignal,
        startedAt,
        completedAt,
        stdout,
        stderr,
      });
    });
  });
}

export function configDefaults() {
  return structuredClone(DEFAULT_CONFIG);
}
