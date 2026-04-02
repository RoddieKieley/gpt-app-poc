# B2 Rollback Drill - Action Buttons

Rollback method:

1. Set `RHDS_STEP1_BUTTON_MODE=patternfly`.
2. Reload app and run step action flows.

Verification:

- [x] Action handlers continue to invoke same callbacks
- [x] Disabled behavior for fetch action remains intact
- [x] B1 status substitution remains unaffected

Result: PASS
