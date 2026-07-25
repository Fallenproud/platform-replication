export type RuntimeSessionId = string;
export type ProjectId = string;
export type ActorId = string;
export type SecretReference = string;

export interface RuntimeRequestContext {
  organizationId: string;
  projectId: ProjectId;
  actorId: ActorId;
  policyDecisionId: string;
  correlationId: string;
}

export interface RuntimeCapability {
  id: string;
  kind: "provider" | "tool" | "extension" | "recipe" | "transport";
  displayName: string;
  version?: string;
  enabled: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateRuntimeSessionInput {
  context: RuntimeRequestContext;
  agentDefinitionId: string;
  providerId: string;
  modelId: string;
  instructions?: string;
  enabledCapabilityIds: string[];
  secretReferences: SecretReference[];
  labels?: Record<string, string>;
}

export interface RuntimeSession {
  id: RuntimeSessionId;
  upstreamSessionId?: string;
  status: "creating" | "ready" | "running" | "idle" | "completed" | "failed" | "cancelled";
  providerId: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuntimeMessageInput {
  context: RuntimeRequestContext;
  sessionId: RuntimeSessionId;
  content: string;
  attachments?: Array<{
    artifactId: string;
    mediaType: string;
  }>;
}

export type RuntimeEvent =
  | { type: "session.status"; sessionId: RuntimeSessionId; status: RuntimeSession["status"]; at: string }
  | { type: "message.delta"; sessionId: RuntimeSessionId; text: string; at: string }
  | { type: "message.completed"; sessionId: RuntimeSessionId; messageId: string; at: string }
  | { type: "tool.requested"; sessionId: RuntimeSessionId; invocationId: string; toolId: string; input: unknown; at: string }
  | { type: "tool.completed"; sessionId: RuntimeSessionId; invocationId: string; output: unknown; at: string }
  | { type: "usage"; sessionId: RuntimeSessionId; inputTokens?: number; outputTokens?: number; cost?: number; at: string }
  | { type: "artifact.created"; sessionId: RuntimeSessionId; artifactId: string; at: string }
  | { type: "error"; sessionId: RuntimeSessionId; code: string; message: string; retryable: boolean; at: string };

export interface RuntimeAdapter {
  health(): Promise<{ ok: boolean; version?: string; details?: Record<string, unknown> }>;
  listCapabilities(context: RuntimeRequestContext): Promise<RuntimeCapability[]>;
  createSession(input: CreateRuntimeSessionInput): Promise<RuntimeSession>;
  getSession(context: RuntimeRequestContext, sessionId: RuntimeSessionId): Promise<RuntimeSession>;
  sendMessage(input: RuntimeMessageInput): AsyncIterable<RuntimeEvent>;
  cancelSession(context: RuntimeRequestContext, sessionId: RuntimeSessionId): Promise<void>;
  closeSession(context: RuntimeRequestContext, sessionId: RuntimeSessionId): Promise<void>;
}

export interface RuntimePolicyBridge {
  authorizeCapability(input: {
    context: RuntimeRequestContext;
    sessionId: RuntimeSessionId;
    capabilityId: string;
    operation: string;
    payloadDigest?: string;
  }): Promise<{ allowed: boolean; decisionId: string; reason?: string }>;
}
