import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type ConnectionStatus = "connected" | "expired" | "revoked" | "error";

export type UserConnection = {
  connectionId: string;
  userId: string;
  jiraBaseUrl: string;
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

  private withDerivedState(record: UserConnection): UserConnection {
    if (record.status === "revoked") return record;
    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      return { ...record, status: "expired", updatedAt: nowIso() };
    }
    return record;
  }

  async create(userId: string, jiraBaseUrl: string): Promise<UserConnection> {
    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000).toISOString();
    const record: UserConnection = {
      connectionId: randomUUID(),
      userId,
      jiraBaseUrl,
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
    return record;
  }

  async getOwned(userId: string, connectionId: string): Promise<UserConnection | null> {
    const store = await this.readStore();
    const raw = store.records[connectionId];
    if (!raw || raw.userId !== userId) return null;
    const derived = this.withDerivedState(raw);
    if (derived.status !== raw.status) {
      store.records[connectionId] = derived;
      await this.writeStore(store);
    }
    return derived;
  }

  async markVerified(userId: string, connectionId: string): Promise<void> {
    const store = await this.readStore();
    const raw = store.records[connectionId];
    if (!raw || raw.userId !== userId) return;
    const next: UserConnection = {
      ...raw,
      status: this.withDerivedState(raw).status,
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
    const derived = this.withDerivedState(raw);
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
    const revoked: UserConnection = {
      ...raw,
      status: "revoked",
      revokedAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.records[connectionId] = revoked;
    await this.writeStore(store);
    return revoked;
  }
}

