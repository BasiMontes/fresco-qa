# ATC CHK-A1: listOwnProfilesReturnsOnlyOwnRow

| Field | Value |
|---|---|
| Component | `ProfilesApi` |
| Type | API, Verification (a read whose outcome is the access rule; control for `CHK-A2`) |
| Source | Report A1 |
| Fixture and role | `{ api }`, role `alergia` |
| Endpoint | `GET /rest/v1/user_profiles?select=id` |
| Signature | `listOwnProfilesReturnsOnlyOwnRow()` |
| Technique | EP valid: owner reads own data |

Fixed assertions: status 200; exactly 1 row; the row belongs to the caller (id or owner column equals the role's `userId`; column to confirm, Q3).
Data: Discover. Tag: none.
