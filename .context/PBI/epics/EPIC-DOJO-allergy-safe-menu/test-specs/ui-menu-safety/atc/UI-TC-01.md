# ATC UI-TC-01: generateMenuForEggAllergicPersona

| Field | Value |
|---|---|
| Component | `CalendarPage` (`tests/components/ui/CalendarPage.ts`) |
| Type | UI, Mutation |
| Source | TC-01, AC-1; UI session run 4 and screenshot 4 |
| Fixture and persona | `{ test }`, `alergia`, API side `fixture.api.asRole('alergia')` |
| Route | `/calendar?semana=<semana_iso>` then click `generate_week_button`; response of `POST /functions/v1/generate-meal-plan` |
| Signature | `generateMenuForEggAllergicPersona(week: GenerateMealPlanPayload)`, returns the 21 slot names keyed by `<dia>_<tipo>` |
| Technique | EP valid partition (declared allergen), 21 slots |
| Data | Generate: week from `api.mealPlans.findFreeWeek()`. Discover: stored profile holds `huevo` (failing `expect`, never skip). Cleanup: `afterEach` `deleteMenuForWeek(week)` |

Precondition: the test logs in through the form (`ui.login.goto()`, `ui.login.loginSuccessfully(credentials)` with `config.auth.roleCredentials('alergia')`), then `ui.calendar.goto(week)`. ATCs do not navigate.

Fixed assertions (inside the ATC): the intercepted generation response is 200 (429 throws `RateLimitError`); the 21 slots `calendar_slot_<dia>_<tipo>` for lunes..domingo times desayuno, comida, cena are visible and each holds a non-empty recipe name; `_sin_receta` and `_excluida` slot markers count 0. Every message carries the drawn week.

Test-level assertions (hybrid, in `generateSafeMenuViaCalendar.test.ts`, literals from the TC):
- stored profile `alergenos` contains `huevo`
- `readMenuForWeek(week)` returns 21 rows, none without a recipe
- rows whose recipe `alergenos` includes `huevo`: `toEqual([])`
- sorted UI slot names equal sorted stored recipe names (the UI shows the real menu)

Quota: 1 of alergia's 5 per hour. Call wrapped in `runUnlessRateLimited`. Tag `@critical`, ignored by `smoke-ui`.
Evidence: full-page screenshot of the calendar attached to the test (replaces TC-01 "screenshot of the menu").
