export type ProviderSessionId = string;
export type CanonicalSessionId = string;

export interface ProviderContext {
  organizationId: string;
  projectId: string;
  actorId: string;
  providerInstallationId: string;
  policyDecisionId: string;
  correlationId: string;
}

export interface SessionQuery {
  search?: string;
  statuses?: string[];
  kinds?: string[];
  activeWithinMinutes?: number;
  includeArchived?: boolean;
  cursor?: string;
  limit?: number;
}

export interface ProviderSessionSummary {
  providerSessionId: ProviderSessionId;
  displayName?: string;
  kind: string;
  status: string;
  agentExternalId?: string;
  parentProviderSessionId?: ProviderSessionId;
  labels: string[];
  updatedAt?: string;
  createdAt?: string;
  inputTokens?: number;
  outputTokens?: number;
  archived?: boolean;
  provenance: {
    provider: string;
    sourceLocation?: string;
    observedAt: string;
  };
}

export interface ProviderSessionDetails extends ProviderSessionSummary {
  objective?: string;
  statusNote?: string;
  runtime?: string;
  model?: string;
  providerName?: string;
  surface?: string;
  room?: string;
  metadata?: Record<string, unknown>;
}

export type ProviderSessionEvent =
  | { type: "session.upsert"; session: ProviderSessionSummary; observedAt: string }
  | { type: "session.removed"; providerSessionId: ProviderSessionId; observedAt: string }
  | { type: "message.appended"; providerSessionId: ProviderSessionId; externalMessageId: string; role: string; content: unknown; observedAt: string }
  | { type: "checkpoint.observed"; providerSessionId: ProviderSessionId; externalCheckpointId: string; summary?: string; observedAt: string }
  | { type: "artifact.observed"; providerSessionId: ProviderSessionId; externalArtifactId: string; mediaType?: string; observedAt: string }
  | { type: "provider.error"; code: string; message: string; retryable: boolean; observedAt: string };

export interface SessionProviderAdapter {
  id: string;
  health(context: ProviderContext): Promise<{ ok: boolean; details?: Record<string, unknown> }>;
  capabilities(context: ProviderContext): Promise<{
    read: boolean;
    stream: boolean;
    archive: boolean;
    branch: boolean;
    restoreCheckpoint: boolean;
    terminal: boolean;
  }>;
  listSessions(
    context: ProviderContext,
    query: SessionQuery,
  ): Promise<{ sessions: ProviderSessionSummary[]; nextCursor?: string }>;
  getSession(context: ProviderContext, providerSessionId: ProviderSessionId): Promise<ProviderSessionDetails>;
  stream(context: ProviderContext): AsyncIterable<ProviderSessionEvent>;
}

export interface SessionIngestionService {
  ingestSummary(context: ProviderContext, summary: ProviderSessionSummary): Promise<CanonicalSessionId>;
  ingestEvent(context: ProviderContext, event: ProviderSessionEvent): Promise<void>;
}
