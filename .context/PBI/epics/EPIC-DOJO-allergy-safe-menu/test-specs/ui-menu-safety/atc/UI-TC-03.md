# ATC UI-TC-03: generateMenuForVeganLactoseFreePersona

| Field | Value |
|---|---|
| Component | `CalendarPage` (`tests/components/ui/CalendarPage.ts`) |
| Type | UI, Mutation |
| Source | TC-03, AC-2; UI session run 5 and screenshot 5 |
| Fixture and persona | `{ test }`, `vegano`, API side `fixture.api.asRole('vegano')` |
| Route | `/calendar?semana=<semana_iso>` then click `generate_week_button` |
| Signature | `generateMenuForVeganLactoseFreePersona(week: GenerateMealPlanPayload)`, returns the 21 slot names |
| Technique | EP valid partition (stacked diets) |
| Data | Generate: free week. Discover: stored profile has `dieta_vegano` and `dieta_sin_lactosa` true and its stored `alergenos`. Cleanup: `deleteMenuForWeek(week)` |

Same private flow as `UI-TC-01` (generate, 200, 21 filled slots); only the persona and the verdict differ.

Fixed assertions: response 200; 21 slots visible with a recipe name; no empty-slot marker.

Test-level assertions (literals from the TC):
- precondition: stored `dieta_vegano` is true and `dieta_sin_lactosa` is true
- every stored recipe of the 21 rows has `dieta.vegano === true` and `dieta.sin_lactosa === true`
- no stored recipe carries an allergen from the persona's stored `alergenos` (read from the profile, not hard-coded, because TC-16 shows the stored list may differ from the chosen one)
- sorted UI names equal sorted stored names

Not asserted: the diet tag on the card. It reads "Vegetariano" for a vegan menu (finding U-06, open question), so asserting it would pin an undecided behaviour. Shopping list content is out of scope.
Quota: 1 of vegano's 5 per hour. `runUnlessRateLimited`. Tag `@critical`, ignored by `smoke-ui`.
