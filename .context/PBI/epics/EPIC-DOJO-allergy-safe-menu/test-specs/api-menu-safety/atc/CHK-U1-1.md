# ATC CHK-U1-1: readPrivateTableWithoutSessionIsDenied

| Field | Value |
|---|---|
| Component | `AccessControlApi` |
| Type | API, Negative |
| Fixture and role | `{ api }` with the session token cleared; the `apikey` header stays |
| Signature | `readPrivateTableWithoutSessionIsDenied(table: DeniedTable)` |
| Technique | EP invalid: no credential; 4 tables (`user_profiles`, `meal_plans`, `meal_plan_recipes`, `user_consents`), same outcome |

Fixed assertions: the fixture has no token; status 401; code `42501`; message matches `/permission denied/i`.
Control: `CHK-U4` runs first (serial). Tag: none.
