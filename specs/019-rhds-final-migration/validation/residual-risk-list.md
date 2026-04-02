# Residual Risk List

1. Manual happy-path validation in this environment cannot fully assert successful real sosreport generation without host diagnostics dependencies.
   - Mitigation: integration suite already validates happy path with deterministic test fixtures.
   - Owner: Engineering
2. RHDS semantic HTML replacements rely on custom CSS for visual parity.
   - Mitigation: keep regression and build/serve checks in release checklist.
   - Owner: UI Maintainer
