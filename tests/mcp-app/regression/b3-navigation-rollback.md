# B3 Rollback Drill - Navigation/Progress

Rollback method:

1. Set `RHDS_STEP1_PROGRESS_MODE=patternfly`.
2. Reload app and traverse step navigation actions.

Verification:

- [x] Step navigation callbacks still route to the same handlers
- [x] B1 and B2 substitutions remain stable after B3 fallback

Result: PASS
