# Data Model: Jira Attachment via User PAT Secret Boundary

## UserConnection

Represents a user-scoped Jira integration record addressable by opaque reference.

- **connection_id** (string, required): Opaque identifier used in MCP and UI flows.
- **user_id** (string, required): Owner identity; enforces per-user isolation.
- **jira_base_url** (string, required): HTTPS Jira instance root URL.
- **status** (enum, required): `connected | expired | revoked | error`.
- **created_at** (datetime, required)
- **updated_at** (datetime, required)
- **expires_at** (datetime, required): Bounded credential lifetime.
- **revoked_at** (datetime, optional)
- **last_verified_at** (datetime, optional)
- **last_error_code** (enum, optional): Non-secret error category.

**Validation rules**:
- `jira_base_url` must be valid HTTPS URL.
- `expires_at` must be greater than `created_at`.
- Access allowed only for matching `user_id`.

**State transitions**:
- `connected -> expired` when TTL elapses.
- `connected -> revoked` on disconnect/revoke action.
- `expired -> connected` on successful reconnect.
- `revoked -> connected` on successful reconnect.

## VaultSecret

Represents encrypted credential material associated with one connection.

- **connection_id** (string, required)
- **ciphertext** (string/blob, required): Encrypted PAT payload.
- **key_version** (string, required): Encryption key reference.
- **created_at** (datetime, required)
- **rotated_at** (datetime, optional)

**Validation rules**:
- Stored only in backend-controlled vault boundary.
- Never serialized into MCP tool responses, logs, or UI payloads.

## ArtifactSelection

Represents a user-selected local artifact intended for Jira attachment.

- **artifact_ref** (string, required): Non-secret local reference.
- **user_id** (string, required)
- **file_path** (string, required; backend-only visibility)
- **filename** (string, required)
- **content_type** (string, optional)
- **size_bytes** (number, required)
- **readable** (boolean, required)
- **validated_at** (datetime, required)

**Validation rules**:
- Must exist and be readable when operation starts.
- Must remain within approved local boundaries.
- Size must be greater than zero and within Jira upload limits.

## JiraAttachmentRecord

Represents non-secret metadata for attachments listed or uploaded to Jira.

- **issue_key** (string, required)
- **attachment_id** (string, required)
- **filename** (string, required)
- **size_bytes** (number, required)
- **author_display_name** (string, optional)
- **created_at** (datetime, required)

## SecurityEvent

Represents audit-safe event telemetry without secret content.

- **event_id** (string, required)
- **user_id** (string, required)
- **connection_id** (string, optional)
- **action** (enum, required): `connect | verify | list_attachments | attach | revoke | expire`.
- **outcome** (enum, required): `success | denied | failed`.
- **error_code** (enum, optional): Sanitized category only.
- **occurred_at** (datetime, required)
- **request_id** (string, optional)

**Validation rules**:
- Must not include PATs, Authorization headers, raw upstream request/response bodies,
  or secret-bearing payload fragments.
