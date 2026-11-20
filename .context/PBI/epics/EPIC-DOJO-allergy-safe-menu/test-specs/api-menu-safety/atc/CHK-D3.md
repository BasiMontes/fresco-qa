# ATC CHK-D3: generateMenuForExistingWeekReturnsConflict

| Field | Value |
|---|---|
| Component | `MealPlansApi` |
| Type | API, Negative (state: the week already has a menu) |
| Source | Report D3 |
| Fixture and role | `{ api }`, role `alergia` |
| Endpoint | `POST /functions/v1/generate-meal-plan` |
| Signature | `generateMenuForExistingWeekReturnsConflict(week: GenerateMealPlanPayload)` |
| Technique | State: one menu per user per ISO week |
| Data | Reuses the week created by `TC-01` in the same test (no extra generation succeeds); cleanup by plan id in `afterEach` |

Fixed assertions: status 409 with the `Ya existe un plan` message; the plan id is unchanged and the SET of recipe ids of the plan is equal before and after the request.
Quota: 1 request, which may count even though it is rejected; alergia total 3 of 5.
Not a chain inside the component: the test body calls `TC-01`, then this ATC, then `TC-02`. Tag: none.
