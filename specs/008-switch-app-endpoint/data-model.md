# Data Model: Development Endpoint Switch

This feature does not introduce persistent storage entities. It defines operational entities used for validation and scope control.

## Entities

### 1) EndpointReference

- **Description**: A concrete URL literal used in runtime metadata, tests, smoke checks, and top-level documentation.
- **Fields**:
  - `value` (string, required): full URL.
  - `role` (enum, required): `active-development` | `legacy`.
  - `location` (string, required): file path where reference appears.
- **Validation Rules**:
  - `active-development` MUST equal `https://leisured-carina-unpromotable.ngrok-free.dev` in in-scope files.
  - `legacy` (`https://gptapppoc.kieley.io`) MUST NOT appear in non-spec paths after migration.

### 2) ScopedArtifact

- **Description**: A repository artifact explicitly allowed for edits by this feature.
- **Fields**:
  - `path` (string, required)
  - `category` (enum, required): `runtime` | `test` | `smoke-test` | `top-level-doc`
  - `mutable` (boolean, required): always `true` for this set
- **Allowed Instances**:
  - `server.ts` (`runtime`)
  - `scripts/mcp-smoke-tests.ts` (`smoke-test`)
  - `tests/contract/engage-red-hat-support.contract.test.ts` (`test`)
  - `README.md` (`top-level-doc`)

### 3) HistoricalSpecArtifact

- **Description**: Specification files under `specs/**` that must remain unchanged for this migration.
- **Fields**:
  - `path` (string, required)
  - `mutable` (boolean, required): always `false` for historical specs
  - `reason` (string, required): scope exclusion from feature requirements
- **Validation Rules**:
  - No historical `specs/**` files are edited as part of implementation.

## Relationships

- A `ScopedArtifact` may contain one or more `EndpointReference` entries.
- A `HistoricalSpecArtifact` may contain legacy endpoint literals but is excluded from migration edits.

## State Transitions

### Endpoint migration status

1. **Pre-migration**: legacy endpoint exists in one or more scoped artifacts.
2. **In-migration**: scoped artifacts are updated to active development endpoint.
3. **Validated**: contract tests and smoke tests pass; non-spec legacy endpoint scan returns no matches.
