# ATC UI-TC-11: generateFullWeekWithoutRepeatedMeals

| Field | Value |
|---|---|
| Component | `CalendarPage` (`tests/components/ui/CalendarPage.ts`) |
| Type | UI, Mutation |
| Source | TC-11, AC-3; UI session finding U-03 |
| Fixture and persona | `{ test }`, `familia`, API side `fixture.api.asRole('familia')` |
| Route | `/calendar?semana=<semana_iso>` then click `generate_week_button` |
| Signature | `generateFullWeekWithoutRepeatedMeals(week: GenerateMealPlanPayload)`, returns the 21 slot names |
| Technique | EP valid partition (profile without restriction), State: future week, so no day is already past |
| Data | Generate: free future week. Cleanup: `deleteMenuForWeek(week)` |

Fixed assertions: response 200; 21 slots visible with a recipe name; no empty-slot marker; the 14 names of the `comida` and `cena` slots are all distinct (a `Set` of those names has size 14, the literal 14 from 7 days times 2 meals).

Test-level assertions: `readMenuForWeek(week)` returns 21 rows with a recipe; stored `comida` and `cena` recipe ids are 14 distinct values (same property on the stored side, so a UI that hid a repeat would still fail).

Dropped, logged: the second half of TC-11 (generate in the current week and expect empty past days, 12 of 21 on a Thursday). It depends on the run date and on PO question 6 (does the 21-dish promise apply on every day).
Open point R5: "no repeated comida or cena" is asserted across both meal types together (stricter than within each type); confirm on the first run.
Quota: 1 of familia's 5 per hour; the API suite does not generate for familia. `runUnlessRateLimited`. No `@critical` (P2).
