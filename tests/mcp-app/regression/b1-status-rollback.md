# B1 Rollback Drill - Status Display

Rollback method:

1. Set `RHDS_STEP1_STATUS_MODE=patternfly`.
2. Reload app and verify `#status` still shows current status message.

Verification:

- [x] Status id and message preserved after fallback
- [x] No callback contract changes required for rollback

Result: PASS
