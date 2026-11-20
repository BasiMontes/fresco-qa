# ATC CHK-A2: readOtherUsersRowsReturnsEmpty

| Field | Value |
|---|---|
| Component | `AccessControlApi` (`tests/components/api/AccessControlApi.ts`) |
| Type | API, Negative (empty list is the access-control outcome) |
| Source | Report A2, A3, A4; TC-15 family (data isolation) |
| Fixture and role | `{ api }`, role `alergia` |
| Endpoint | `GET /rest/v1/<table>?<owner column>=eq.<victimId>` |
| Signature | `readOtherUsersRowsReturnsEmpty({ table, ownerId })` |
| Technique | EP merge: same outcome (200 and 0 rows) across 3 tables and 2 victims; one parameterized ATC, 6 rows |

| Table | Victims |
|---|---|
| `user_profiles` | vegano, familia |
| `meal_plans` | vegano, familia |
| `user_consents` | vegano, familia |

Fixed assertions: status 200; body is an empty array.
Data: Discover victim ids from `loadRoleState`. Owner column name per table is (inferred) `user_id` or `id`; confirm in Phase 2 (Q3).
Controls: `CHK-A1` (caller reads its own profile) and the read-only helper `readOwnRowsReturnsRows` (the victim owns at least one row in each table), run first for every table and victim.
Tag: none.
