import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type ConnectionStatus = "connected" | "expired" | "revoked" | "error";

export type UserConnection = {
  connectionId: string;
  userId: string;
  jiraBaseUrl: string;
  authMode?: "bearer_pat" | "basic_cloud";
  accountEmail?: string | null;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastVerifiedAt: string | null;
  lastErrorCode: string | null;
};

type ConnectionStore = {
  records: Record<string, UserConnection>;
};

const DEFAULT_FILE = path.join(process.cwd(), ".data", "jira-connections.json");

const nowIso = () => new Date().toISOString();

export class ConnectionLifecycleStore {
  constructor(
    private readonly filePath = DEFAULT_FILE,
    private readonly ttlSeconds = Number.parseInt(process.env.JIRA_CONNECTION_TTL_SECONDS ?? "86400", 10),
  ) {}

  private async readStore(): Promise<ConnectionStore> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as ConnectionStore;
      return { records: parsed.records ?? {} };
    } catch {
      return { records: {} };
    }
  }

  private async writeStore(store: ConnectionStore) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(store, null, 2), "utf8");
  }

  private normalizeRecord(record: UserConnection): UserConnection {
    return {
      ...record,
      authMode: record.authMode ?? "bearer_pat",
      accountEmail: record.accountEmail ?? null,
    };
  }

  private withDerivedState(record: UserConnection): UserConnection {
    const normalized = this.normalizeRecord(record);
    if (normalized.status === "revoked") return normalized;
    if (new Date(normalized.expiresAt).getTime() <= Date.now()) {
      return { ...normalized, status: "expired", updatedAt: nowIso() };
    }
    return normalized;
  }

  async create(
    userId: string,
    jiraBaseUrl: string,
    options?: { authMode?: "bearer_pat" | "basic_cloud"; accountEmail?: string | null },
  ): Promise<UserConnection> {
    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000).toISOString();
    const record: UserConnection = {
      connectionId: randomUUID(),
      userId,
      jiraBaseUrl,
      authMode: options?.authMode ?? "bearer_pat",
      accountEmail: options?.accountEmail ?? null,
      status: "connected",
      createdAt,
      updatedAt: createdAt,
      expiresAt,
      revokedAt: null,
      lastVerifiedAt: null,
      lastErrorCode: null,
    };
    const store = await this.readStore();
    store.records[record.connectionId] = record;
    await this.writeStore(store);
    return this.normalizeRecord(record);
  }

  async getOwned(userId: string, connectionId: string): Promise<UserConnection | null> {
    const store = await this.readStore();
    const raw = store.records[connectionId];
    if (!raw || raw.userId !== userId) return null;
    const normalized = this.normalizeRecord(raw);
    const derived = this.withDerivedState(normalized);
    if (
      derived.status !== raw.status
      || derived.authMode !== raw.authMode
      || derived.accountEmail !== (raw.accountEmail ?? null)
    ) {
      store.records[connectionId] = derived;
      await this.writeStore(store);
    }
    return derived;
  }

  async markVerified(userId: string, connectionId: string): Promise<void> {
    const store = await this.readStore();
    const raw = store.records[connectionId];
    if (!raw || raw.userId !== userId) return;
    const normalized = this.normalizeRecord(raw);
    const next: UserConnection = {
      ...normalized,
      status: this.withDerivedState(normalized).status,
      lastVerifiedAt: nowIso(),
      updatedAt: nowIso(),
      lastErrorCode: null,
    };
    store.records[connectionId] = next;
    await this.writeStore(store);
  }

  async markError(userId: string, connectionId: string, errorCode: string): Promise<void> {
    const store = await this.readStore();
    const raw = store.records[connectionId];
    if (!raw || raw.userId !== userId) return;
    const derived = this.withDerivedState(this.normalizeRecord(raw));
    const nextStatus: ConnectionStatus =
      derived.status === "revoked" || derived.status === "expired"
        ? derived.status
        : "error";
    store.records[connectionId] = {
      ...derived,
      status: nextStatus,
      updatedAt: nowIso(),
      lastErrorCode: errorCode,
    };
    await this.writeStore(store);
  }

  async revoke(userId: string, connectionId: string): Promise<UserConnection | null> {
    const store = await this.readStore();
    const raw = store.records[connectionId];
    if (!raw || raw.userId !== userId) return null;
    const normalized = this.normalizeRecord(raw);
    const revoked: UserConnection = {
      ...normalized,
      status: "revoked",
      revokedAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.records[connectionId] = revoked;
    await this.writeStore(store);
    return revoked;
  }
}

