import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type ConsentScope = "generate_sosreport";

export type ConsentTokenClaims = {
  sub: string;
  session_id: string;
  scope: ConsentScope;
  step: 2;
  exp: number;
  iat: number;
  jti: string;
};

export type ConsentVerificationErrorCode =
  | "consent_invalid"
  | "consent_expired"
  | "consent_wrong_user"
  | "consent_session_mismatch"
  | "consent_wrong_scope"
  | "consent_wrong_step";

export type ConsentVerificationResult =
  | { ok: true; claims: ConsentTokenClaims }
  | { ok: false; code: ConsentVerificationErrorCode };

type TokenMintInput = {
  userId: string;
  sessionId: string;
  scope: ConsentScope;
  step: 2;
  nowMs?: number;
};

type TokenVerifyInput = {
  token: string;
  expectedUserId: string;
  expectedSessionId: string;
  expectedScope: ConsentScope;
  expectedStep: 2;
  nowMs?: number;
};

type ReservationState = {
  status: "pending" | "used";
  exp: number;
};

export class ConsentTokenService {
  private readonly ttlSeconds: number;

  private readonly clockSkewSeconds: number;

  private readonly signingKey: string;

  private readonly reservations = new Map<string, ReservationState>();

  constructor(options: { signingKey: string; ttlSeconds?: number; clockSkewSeconds?: number }) {
    this.signingKey = options.signingKey;
    this.ttlSeconds = options.ttlSeconds ?? 120;
    this.clockSkewSeconds = options.clockSkewSeconds ?? 5;
  }

  mint(input: TokenMintInput): { token: string; claims: ConsentTokenClaims; expiresAt: string } {
    const nowSeconds = Math.floor((input.nowMs ?? Date.now()) / 1000);
    const claims: ConsentTokenClaims = {
      sub: input.userId,
      session_id: input.sessionId,
      scope: input.scope,
      step: input.step,
      iat: nowSeconds,
      exp: nowSeconds + this.ttlSeconds,
      jti: randomUUID(),
    };
    const token = this.sign(claims);
    return {
      token,
      claims,
      expiresAt: new Date(claims.exp * 1000).toISOString(),
    };
  }

  verify(input: TokenVerifyInput): ConsentVerificationResult {
    const verified = this.verifyAndDecode(input.token);
    if (!verified) return { ok: false, code: "consent_invalid" };
    const claims = verified;
    const nowSeconds = Math.floor((input.nowMs ?? Date.now()) / 1000);

    if (claims.exp + this.clockSkewSeconds < nowSeconds) {
      return { ok: false, code: "consent_expired" };
    }
    if (claims.sub !== input.expectedUserId) {
      return { ok: false, code: "consent_wrong_user" };
    }
    if (claims.session_id !== input.expectedSessionId) {
      return { ok: false, code: "consent_session_mismatch" };
    }
    if (claims.scope !== input.expectedScope) {
      return { ok: false, code: "consent_wrong_scope" };
    }
    if (claims.step !== input.expectedStep) {
      return { ok: false, code: "consent_wrong_step" };
    }
    return { ok: true, claims };
  }

  reserveSingleUse(claims: ConsentTokenClaims, nowMs = Date.now()): boolean {
    this.cleanupExpired(nowMs);
    const existing = this.reservations.get(claims.jti);
    if (existing) return false;
    this.reservations.set(claims.jti, { status: "pending", exp: claims.exp });
    return true;
  }

  finalizeSingleUse(jti: string, success: boolean): void {
    const existing = this.reservations.get(jti);
    if (!existing || existing.status !== "pending") return;
    if (success) {
      this.reservations.set(jti, { ...existing, status: "used" });
      return;
    }
    this.reservations.delete(jti);
  }

  private cleanupExpired(nowMs: number): void {
    const nowSeconds = Math.floor(nowMs / 1000);
    for (const [jti, state] of this.reservations.entries()) {
      if (state.exp + this.clockSkewSeconds < nowSeconds) {
        this.reservations.delete(jti);
      }
    }
  }

  private sign(claims: ConsentTokenClaims): string {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedClaims = this.base64UrlEncode(JSON.stringify(claims));
    const payload = `${encodedHeader}.${encodedClaims}`;
    const signature = this.base64UrlEncode(
      createHmac("sha256", this.signingKey).update(payload).digest(),
    );
    return `${payload}.${signature}`;
  }

  private verifyAndDecode(token: string): ConsentTokenClaims | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedClaims, providedSignature] = parts;
    const payload = `${encodedHeader}.${encodedClaims}`;
    const expectedSignature = this.base64UrlEncode(
      createHmac("sha256", this.signingKey).update(payload).digest(),
    );
    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(providedSignature);
    if (expectedBuffer.length !== providedBuffer.length) return null;
    if (!timingSafeEqual(expectedBuffer, providedBuffer)) return null;

    try {
      const parsed = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8")) as Partial<
        ConsentTokenClaims
      >;
      if (
        typeof parsed.sub !== "string" ||
        typeof parsed.session_id !== "string" ||
        typeof parsed.scope !== "string" ||
        typeof parsed.step !== "number" ||
        typeof parsed.exp !== "number" ||
        typeof parsed.iat !== "number" ||
        typeof parsed.jti !== "string"
      ) {
        return null;
      }
      return parsed as ConsentTokenClaims;
    } catch {
      return null;
    }
  }

  private base64UrlEncode(value: string | Buffer): string {
    return Buffer.from(value).toString("base64url");
  }
}
