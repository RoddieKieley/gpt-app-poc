import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

type VaultRecord = {
  ciphertext: string;
  iv: string;
  tag: string;
  keyVersion: string;
  createdAt: string;
};

type VaultFile = {
  records: Record<string, VaultRecord>;
};

const DEFAULT_FILE = path.join(process.cwd(), ".data", "token-vault.json");
const DEFAULT_KEY_VERSION = "v1";

const ensureDir = async (filePath: string) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const toKey = (material: string) =>
  createHash("sha256").update(material, "utf8").digest();

export class TokenVault {
  constructor(
    private readonly filePath = DEFAULT_FILE,
    private readonly keyMaterial = process.env.TOKEN_VAULT_MASTER_KEY ?? "dev-only-change-me",
    private readonly keyVersion = DEFAULT_KEY_VERSION,
  ) {}

  private async readVault(): Promise<VaultFile> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as VaultFile;
      return { records: parsed.records ?? {} };
    } catch {
      return { records: {} };
    }
  }

  private async writeVault(file: VaultFile) {
    await ensureDir(this.filePath);
    await fs.writeFile(this.filePath, JSON.stringify(file, null, 2), "utf8");
  }

  async store(connectionId: string, secret: string): Promise<void> {
    const key = toKey(this.keyMaterial);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    const file = await this.readVault();
    file.records[connectionId] = {
      ciphertext: encrypted.toString("base64"),
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      keyVersion: this.keyVersion,
      createdAt: new Date().toISOString(),
    };
    await this.writeVault(file);
  }

  async resolve(connectionId: string): Promise<string | null> {
    const file = await this.readVault();
    const rec = file.records[connectionId];
    if (!rec) return null;

    const key = toKey(this.keyMaterial);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(rec.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(rec.tag, "base64"));

    const plain = Buffer.concat([
      decipher.update(Buffer.from(rec.ciphertext, "base64")),
      decipher.final(),
    ]);
    return plain.toString("utf8");
  }

  async revoke(connectionId: string): Promise<void> {
    const file = await this.readVault();
    delete file.records[connectionId];
    await this.writeVault(file);
  }
}

