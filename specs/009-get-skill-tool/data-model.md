# Data Model: Get Skill Tool Fallback

**Feature**: 009-get-skill-tool  
**Date**: 2026-02-18

This feature introduces a read-only skill lookup interaction model. It does not add persistent storage.

## Entities

### SkillLookupRequest

- **Fields**:
  - `uri: string`
- **Validation rules**:
  - Required and non-empty.
  - Must use `skill://` scheme.
  - Must resolve to a registered skill identity.
- **Role**: Represents tool input for `get_skill`.

### RegisteredSkill

- **Fields**:
  - `uri: string` (canonical skill URI)
  - `mimeType: "text/markdown"`
  - `text: string` (markdown body)
  - `availability: "available" | "fallback"`
- **Validation rules**:
  - URI must match known registration set (minimum: engage skill URI).
  - Text must be non-empty in success responses.
- **Role**: Canonical skill representation used by resource and tool parity checks.

### GetSkillSuccessResponse

- **Fields**:
  - `isError: false`
  - `content: Array<{ type: "text"; text: string }>`
  - `structuredContent: { uri: string; mimeType: "text/markdown"; text: string }`
- **Validation rules**:
  - Text fallback is required and human-readable.
  - Structured fields must match canonical URI/mime type/content.
- **Role**: Standardized success envelope for both UI and non-UI host compatibility.

### GetSkillErrorResponse

- **Fields**:
  - `isError: true`
  - `content: Array<{ type: "text"; text: string }>`
- **Validation rules**:
  - Must provide actionable remediation (expected format or discovery hint).
  - Must not include secret/token/credential values.
- **Role**: Safe failure envelope for invalid or unsupported URI requests.

## Relationships

- One `SkillLookupRequest` maps to zero or one `RegisteredSkill`.
- A matched `RegisteredSkill` produces a `GetSkillSuccessResponse`.
- A non-matched request produces a `GetSkillErrorResponse`.

## State Transitions

1. `received` -> `validated_format` (non-empty, `skill://` scheme)
2. `validated_format` -> `resolved` (known registered skill URI) OR `rejected_unsupported`
3. `resolved` -> `responded_success`
4. `rejected_unsupported` -> `responded_error`

## Secret Boundary Constraints

- No PAT/token/credential fields are accepted by `SkillLookupRequest`.
- Success and error responses contain only URI, mime type, markdown text, and remediation guidance.
- Tool logging and error messaging remain sanitized and non-secret.
