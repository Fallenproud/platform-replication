export type Identifier = string;
export type IsoTimestamp = string;

export interface ActorContext {
  actorId: Identifier;
  actorType: "user" | "agent" | "service";
  organizationId: Identifier;
  projectId: Identifier;
  environmentId: Identifier;
  sessionId?: Identifier;
  agentRunId?: Identifier;
}

export interface ProvenanceContext {
  correlationId: Identifier;
  causationId?: Identifier;
  requestedAt: IsoTimestamp;
  source: string;
}

export interface PolicyEnvelope {
  decisionId: Identifier;
  outcome: "allow" | "deny" | "approval_required";
  expiresAt?: IsoTimestamp;
  constraints: Record<string, unknown>;
}

export interface TaskExecutionRequest {
  requestId: Identifier;
  actor: ActorContext;
  provenance: ProvenanceContext;
  policy: PolicyEnvelope;
  queue: {
    name: string;
    scope?: string;
    priority?: number;
  };
  execution: {
    commandClass: string;
    executable: string;
    args: string[];
    workingDirectoryRef: Identifier;
    environmentRefs: Identifier[];
    timeoutSeconds: number;
    resourceProfile?: string;
  };
}

export type TaskExecutionStatus =
  | "pending_policy"
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "timed_out"
  | "rejected";

export interface TaskExecutionRecord {
  taskId: Identifier;
  requestId: Identifier;
  providerId: string;
  status: TaskExecutionStatus;
  queuePosition?: number;
  submittedAt: IsoTimestamp;
  startedAt?: IsoTimestamp;
  completedAt?: IsoTimestamp;
  exitCode?: number;
  artifactRefs: Identifier[];
  error?: {
    code: string;
    message: string;
  };
}

export interface TaskExecutionEvent {
  eventId: Identifier;
  taskId: Identifier;
  type:
    | "admitted"
    | "queued"
    | "position_changed"
    | "started"
    | "stdout"
    | "stderr"
    | "cancel_requested"
    | "process_terminated"
    | "completed";
  occurredAt: IsoTimestamp;
  payload: Record<string, unknown>;
}

export interface TaskSchedulerProvider {
  readonly id: string;
  readonly capabilities: {
    local: boolean;
    distributed: boolean;
    hierarchicalQueues: boolean;
    streaming: boolean;
    cancellation: boolean;
    sandboxed: boolean;
  };

  submit(request: TaskExecutionRequest): Promise<TaskExecutionRecord>;
  get(taskId: Identifier, actor: ActorContext): Promise<TaskExecutionRecord>;
  cancel(taskId: Identifier, actor: ActorContext, reason: string): Promise<TaskExecutionRecord>;
  events(taskId: Identifier, actor: ActorContext): AsyncIterable<TaskExecutionEvent>;
}

export interface InstructionSource {
  sourceId: Identifier;
  repositoryRootRef: Identifier;
  rulesPath: string;
  skillPaths: string[];
  commandPaths: string[];
  mcpConfigurationRef?: Identifier;
  targetAgents: string[];
}

export interface InstructionCompilePlan {
  planId: Identifier;
  source: InstructionSource;
  writes: Array<{
    path: string;
    operation: "create" | "replace" | "symlink" | "delete";
    contentDigest?: string;
  }>;
  warnings: string[];
}

export interface InstructionCompileResult {
  planId: Identifier;
  generatedAt: IsoTimestamp;
  compilerId: string;
  compilerVersion: string;
  changedPaths: string[];
  deletedPaths: string[];
  sourceDigest: string;
  outputDigest: string;
}

export interface InstructionCompilerProvider {
  readonly id: string;
  plan(source: InstructionSource, actor: ActorContext): Promise<InstructionCompilePlan>;
  compile(plan: InstructionCompilePlan, actor: ActorContext, policy: PolicyEnvelope): Promise<InstructionCompileResult>;
  verify(source: InstructionSource, actor: ActorContext): Promise<{
    inSync: boolean;
    driftedPaths: string[];
  }>;
}

export interface CodeIndexWorkspace {
  workspaceId: Identifier;
  rootRef: Identifier;
  providerId: string;
  indexVersion?: string;
  indexedAt?: IsoTimestamp;
  languages: string[];
}

export interface SymbolLocation {
  path: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface IndexedSymbol {
  symbolId: string;
  displayName: string;
  kind: string;
  language: string;
  location?: SymbolLocation;
  containerName?: string;
}

export interface SymbolOccurrence {
  symbolId: string;
  role: "definition" | "declaration" | "reference" | "call" | "write" | "read" | "unknown";
  location: SymbolLocation;
}

export interface CodeIndexProvider {
  readonly id: string;
  readonly capabilities: {
    platforms: string[];
    languages: string[];
    definitions: boolean;
    references: boolean;
    callSites: boolean;
    symbolSearch: boolean;
  };

  openWorkspace(rootRef: Identifier, actor: ActorContext): Promise<CodeIndexWorkspace>;
  searchSymbols(workspaceId: Identifier, query: string, actor: ActorContext): Promise<IndexedSymbol[]>;
  occurrences(workspaceId: Identifier, symbolId: string, actor: ActorContext): Promise<SymbolOccurrence[]>;
  symbolAt(workspaceId: Identifier, location: SymbolLocation, actor: ActorContext): Promise<IndexedSymbol[]>;
  closeWorkspace(workspaceId: Identifier, actor: ActorContext): Promise<void>;
}
