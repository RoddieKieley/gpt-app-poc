# Feature Specification: MCP Runtime Skill Discovery (Hello World Skill)

**Feature Branch**: `005-mcp-skill-discovery`  
**Created**: 2026-02-13  
**Status**: Draft  
**Input**: User description: "Add MCP runtime skill discovery for a repo-local Hello World skill in two increments: expose SKILL.md as a canonical MCP resource, then add a tiny read-only discovery tool that references the same skill URI."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Expose Hello World skill as MCP resource (Priority: P1)

**Increment 1.** A client (human or agent) can read the repo-local Hello World skill definition via the MCP protocol. The skill is represented by a single canonical document (SKILL.md) and is exposed as an MCP resource at a stable URI. Clients that support MCP resources can fetch this resource to obtain the skill metadata and procedural guidance.

**Why this priority**: The resource is the foundation; discovery and tooling depend on a stable, canonical way to access the skill content.

**Independent Test**: Start the MCP server, request the skill resource by its URI via the standard MCP resources protocol, and confirm the returned content is the Hello World SKILL.md (or equivalent canonical form). Delivers value by making the skill machine-readable without any tool beyond resource read.

**Acceptance Scenarios**:

1. **Given** the MCP server is running with this feature, **When** a client requests the canonical Hello World skill resource URI, **Then** the server returns the skill document content with a valid MIME type and the same logical content as the repo-local SKILL.md.
2. **Given** the skill is exposed as an MCP resource, **When** the resource is read, **Then** the response does not require authentication beyond what the MCP session already has (read-only exposure).

---

### User Story 2 - Read-only discovery tool referencing skill URI (Priority: P2)

**Increment 2.** A client can call a small, read-only MCP tool to discover the Hello World skill. The tool returns (or references) the same canonical skill URI that is used for the MCP resource in Increment 1. No side effects; the tool is for discovery only.

**Why this priority**: Builds on the resource; enables agents and UIs to discover the skill via tools/list and a single call without hardcoding the URI.

**Independent Test**: List MCP tools, call the discovery tool with no or minimal arguments, and verify the response includes the same skill URI used to read the SKILL.md resource. Delivers value by providing a single entry point for “what skills are available?” that aligns with the resource URI.

**Acceptance Scenarios**:

1. **Given** the MCP server exposes both the skill resource and the discovery tool, **When** a client invokes the discovery tool, **Then** the tool response includes the canonical Hello World skill URI that can be used to read the skill via MCP resources.
2. **Given** the discovery tool is read-only, **When** the tool is called, **Then** no state is changed and no side effects occur beyond returning the skill reference.

---

### Edge Cases

- What happens when the repo-local SKILL.md is missing or unreadable? The MCP server should respond with an appropriate error or fallback when the resource is requested (e.g., 404 or minimal placeholder), and the discovery tool may still return the URI with a note that the resource is currently unavailable.
- How does the system handle multiple skills later? This feature defines one canonical skill URI and one discovery tool; future work may extend to multiple skills and a list of URIs from the discovery tool.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a repo-local Hello World skill as a single canonical MCP resource at a stable URI, whose content corresponds to SKILL.md (or equivalent canonical skill document).
- **FR-002**: The canonical skill resource URI MUST be the single source of truth for the Hello World skill; the same URI MUST be used for both resource read and for the discovery tool’s reference.
- **FR-003**: The system MUST provide a read-only MCP tool that returns or references the same canonical skill URI, so clients can discover the skill without hardcoding the URI.
- **FR-004**: The discovery tool MUST have no side effects (read-only); it MUST NOT modify server or client state.
- **FR-005**: The system MUST allow clients to fetch the skill document via the standard MCP resource read flow using the canonical URI.

### Key Entities

- **Canonical skill URI**: Stable identifier for the Hello World skill; used as the MCP resource URI and as the value (or reference) returned by the discovery tool.
- **SKILL.md (canonical skill document)**: Repo-local file or equivalent content that defines the Hello World skill (metadata and procedural guidance); served as the body of the MCP resource at the canonical URI.
- **Discovery tool**: Read-only MCP tool that returns or references the canonical skill URI for runtime discovery.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A client can retrieve the Hello World skill content by URI via MCP resources/read and receive content equivalent to the repo-local SKILL.md.
- **SC-002**: A client can discover the Hello World skill by calling one read-only MCP tool and obtain the same URI used for resource read.
- **SC-003**: The discovery tool appears in MCP tools/list and can be invoked with no required arguments; response includes the canonical skill URI.
- **SC-004**: No secret or sensitive data is exposed in the skill resource or discovery tool response; exposure is read-only and appropriate for public or in-repo skill definitions.
