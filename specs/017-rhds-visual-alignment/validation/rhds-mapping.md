# RHDS Mapping - Step 0

Date: 2026-04-02

## Typography

- UI shell and loading/fallback text now use RHDS-informed font stack tokens:
  - `--rhds-font-family`
  - `--rhds-font-family-heading`
- Applied in `src/mcp-app/rhds-step0.css` for shell/title/loading surfaces.

## Spacing

- Added spacing token scale for consistent rhythm:
  - `--rhds-space-2xs`, `--rhds-space-xs`, `--rhds-space-sm`, `--rhds-space-md`, `--rhds-space-lg`, `--rhds-space-xl`
- Applied to form layouts, action groups, alert/title spacing, and shell padding.

## Color Hierarchy

- Added semantic shell and text tokens:
  - `--rhds-shell-bg`, `--rhds-surface-bg`, `--rhds-text-primary`, `--rhds-text-muted`, `--rhds-border-subtle`
- Added semantic status palette tokens:
  - `--rhds-status-info`, `--rhds-status-success`, `--rhds-status-warning`, `--rhds-status-danger`

## Status Styling

- Preserved existing PatternFly status behavior while improving visual hierarchy through spacing and shell context classes:
  - `rhds-shell__status-alert`

## Loading Polish

- Added loading-state spacing/stability class:
  - `rhds-step2-spinner`
- Added shell loading/fallback text classes in `mcp-app.html`:
  - `gpt-app-loading-title`
  - `gpt-app-loading-note`

## Fallback Polish

- Added presentational-only fallback shell style in `server.ts` fallback HTML.
- Preserved fallback workflow instruction text and sequence exactly.
