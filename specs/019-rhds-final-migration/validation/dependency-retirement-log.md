# Dependency Retirement Log

| Artifact | Decision | Outcome |
|---|---|---|
| `@patternfly/react-core` | Remove | Removed from `package.json` and `package-lock.json` |
| `@patternfly/react-icons` | Remove | Removed from `package.json` and `package-lock.json` |
| `@patternfly/react-core/dist/styles/base.css` import | Remove | Removed from `src/mcp-app.ts` |

No residual PatternFly runtime dependency remains in `src/`.
