import {
  type ConsentScope,
  ConsentTokenService,
  type ConsentTokenClaims,
  type ConsentVerificationErrorCode,
} from "./consent-token-service.js";

export type SensitiveToolName = "generate_sosreport";

export type PolicyReasonCode =
  | "consent_missing"
  | "consent_invalid"
  | "consent_expired"
  | "consent_replayed"
  | "consent_wrong_user"
  | "consent_session_mismatch"
  | "consent_wrong_scope"
  | "consent_wrong_step"
  | "authorized";

export type PolicyDecision =
  | {
      allowed: true;
      reasonCode: "authorized";
      safeText: string;
      claims: ConsentTokenClaims;
    }
  | {
      allowed: false;
      reasonCode: Exclude<PolicyReasonCode, "authorized">;
      safeText: string;
    };

const denyTextFor = (reasonCode: Exclude<PolicyReasonCode, "authorized">): string => {
  switch (reasonCode) {
    case "consent_missing":
      return [
        "Consent required before diagnostics.",
        "Complete Step 1 product selection first, then request Step 2 consent and retry generate_sosreport.",
      ].join(" ");
    case "consent_invalid":
      return "Consent token is invalid. Re-run Step 2 Generate to obtain a fresh token.";
    case "consent_expired":
      return "Consent token expired. Re-run Step 2 Generate to mint a new token.";
    case "consent_replayed":
      return "Consent token was already used. Re-run Step 2 Generate for a one-time token.";
    case "consent_wrong_user":
    case "consent_session_mismatch":
      return "Consent token does not match current user/session. Mint a new token from this session.";
    case "consent_wrong_scope":
    case "consent_wrong_step":
      return "Consent token is not valid for this operation. Mint a Step 2 generate_sosreport token.";
  }
};

const mapVerifyCode = (code: ConsentVerificationErrorCode): Exclude<PolicyReasonCode, "authorized" | "consent_missing" | "consent_replayed"> => {
  switch (code) {
    case "consent_invalid":
      return "consent_invalid";
    case "consent_expired":
      return "consent_expired";
    case "consent_wrong_user":
      return "consent_wrong_user";
    case "consent_session_mismatch":
      return "consent_session_mismatch";
    case "consent_wrong_scope":
      return "consent_wrong_scope";
    case "consent_wrong_step":
      return "consent_wrong_step";
  }
};

export const authorizeSensitiveToolCall = (input: {
  toolName: SensitiveToolName;
  consentToken: string | undefined;
  userId: string;
  sessionId: string;
  consentService: ConsentTokenService;
  expectedScope?: ConsentScope;
  expectedStep?: 2;
}): PolicyDecision => {
  if (!input.consentToken || input.consentToken.trim().length === 0) {
    return {
      allowed: false,
      reasonCode: "consent_missing",
      safeText: denyTextFor("consent_missing"),
    };
  }

  const verify = input.consentService.verify({
    token: input.consentToken,
    expectedUserId: input.userId,
    expectedSessionId: input.sessionId,
    expectedScope: input.expectedScope ?? "generate_sosreport",
    expectedStep: input.expectedStep ?? 2,
  });
  if (!verify.ok) {
    const reasonCode = mapVerifyCode(verify.code);
    return {
      allowed: false,
      reasonCode,
      safeText: denyTextFor(reasonCode),
    };
  }

  const reserved = input.consentService.reserveSingleUse(verify.claims);
  if (!reserved) {
    return {
      allowed: false,
      reasonCode: "consent_replayed",
      safeText: denyTextFor("consent_replayed"),
    };
  }

  return {
    allowed: true,
    reasonCode: "authorized",
    safeText: "Consent token accepted.",
    claims: verify.claims,
  };
};
