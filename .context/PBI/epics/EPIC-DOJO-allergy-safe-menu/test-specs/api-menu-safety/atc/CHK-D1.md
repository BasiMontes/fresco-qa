# ATC CHK-D1: generateMenuWithMissingFields

| Field | Value |
|---|---|
| Component | `MealPlansApi` |
| Type | API, Negative |
| Source | Report D1 |
| Fixture and role | `{ api }`, role `familia` (quota-isolated) |
| Endpoint | `POST /functions/v1/generate-meal-plan` |
| Signature | `generateMenuWithMissingFields(payload: Partial<GenerateMealPlanPayload>)` |
| Technique | EP invalid: required field absent; one `test()` per row from a data array |

| Payload |
|---|
| `{}` |
| `{ semana_iso: <valid week> }` |

Fixed assertions: status exactly 400; the error matches `/Faltan campos/` (field order not asserted). If the product wrongly accepts the request and creates a plan, the test fails and `afterEach` deletes that plan. Role `familia`; generation calls wrapped in `runUnlessRateLimited`.
Quota risk: unknown whether a rejected request consumes quota (API-03); only 2 rows here, and `CHK-D2` adds 2, so `familia` stays at 4 of 5.
Tag: none.
