# ATC CHK-A5: updateOtherUsersProfileChangesNothing

| Field | Value |
|---|---|
| Component | `ProfilesApi` |
| Type | API, Negative |
| Source | Report A5, A6 |
| Fixture and role | `{ api }`, role `alergia`; victim snapshots through `api.asRole('vegano' / 'familia')` |
| Endpoint | `PATCH /rest/v1/user_profiles?<owner column>=eq.<victimId>` with `Prefer: return=representation` |
| Signature | `updateOtherUsersProfileChangesNothing(victimId: string, current: Household)` |
| Technique | EP invalid: foreign owner; 2 victims, one parameterized ATC |
| Data | Discover victim id and current value; no state to clean |

Fixed assertions: the PATCH returns 0 rows.
Test-level (A6): the victim's profile read by the victim before and after the attack is deep-equal.
Safety: the patch sends the victim's current household value, so if RLS were broken nothing real would change (risk R4); the 0-row count still detects the failure. Tradeoff: a changed value is a stronger test but can damage a persona; owner can ask for it with restore.
Tag: none.
