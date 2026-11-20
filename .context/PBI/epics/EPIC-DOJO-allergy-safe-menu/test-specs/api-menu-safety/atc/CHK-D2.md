# ATC CHK-D2: generateMenuWithInvalidWeek

| Field | Value |
|---|---|
| Component | `MealPlansApi` |
| Type | API, Negative |
| Source | Report D2 |
| Fixture and role | `{ api }`, role `familia` |
| Endpoint | `POST /functions/v1/generate-meal-plan` |
| Signature | `generateMenuWithInvalidWeek(payload: GenerateMealPlanPayload)` |
| Technique | EP invalid value (present but not a real ISO week) plus BVA low edge |

| `semana_iso` | Reason | Expected |
|---|---|---|
| `2026-W99` | Report D2 | 400 |
| `2026-W00` | Lower edge, week 0 does not exist | 400 |

Dropped for quota: `W54` and a malformed string (upper edge and format partition), valid edges `W01` and `W53`. Logged as a scope-driven drop in the plan.
Fixed assertions: status exactly 400; the error matches `/no son v/i`. One `test()` per row; a wrongly created plan fails the test and is removed by `afterEach`.
`fecha_inicio` in the payload is a valid Monday so only the week is invalid.
Tag: none.
