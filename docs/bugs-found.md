# Bugs found: Allergy-safe weekly menu

Defects found while testing the Fresco allergy-safe weekly menu. Sources are the session reports in `docs/session-reports/` and the cases in `docs/test-cases.md`.

**Status of every entry: Candidate, not confirmed with the PO.** No Story or specification exists, so the acceptance criteria (AC) were derived by QA in `docs/feature-test-plan.md`. No ticket was filed: the QAFRESCO project has no issues, and the entries below carry no Jira key. Each defect was observed in one run on a local copy of the product (staging cannot be driven past the captcha, see `docs/session-reports/ui-session.md` section 1), so none has been reproduced a second time.

Severity scale: Major (wrong behaviour on health or money data), Minor (wrong but low impact), Question (behaviour that may be intended). Priority: P1 fix before release, P2 should fix, P3 nice to fix.

## BUG-01 Vegan diet silently stores allergens the user did not choose

| Field | Value |
|---|---|
| Severity / Priority | Major / P2. Health data is stored without the user choosing it, and the AC-8 consent only covers what the user declares |
| Area | UI, DB |
| Linked case / AC | TC-16 / AC-1, AC-8 |
| Status | Candidate, not confirmed with the PO |
| Evidence | `docs/session-reports/ui-session.md` section 5 (U-02) and section 4 (stored profile of persona B). No screenshot of this step exists |
| Automated coverage | None |

Preconditions: local stack running, no existing account for persona B.

Steps:
1. Sign up a new account (persona B, `VEGANO`) through the signup form.
2. In the diet step of the onboarding choose only "vegano" and "sin lactosa". Select no allergen.
3. Tick the health-data consent and finish the onboarding.
4. Read the stored profile (read-only query on the local database).

Expected: no allergen is stored, or the summary shows every allergen the user did not choose.

Actual: the stored profile held `pescado`, `sulfitos` and `huevo`, and the diet step showed them as selected. Whether the summary screen shows them was not checked.

Note: the effect is over-restriction (fewer recipes), not an unsafe menu.

## BUG-02 Menu over the weekly budget shows no warning

| Field | Value |
|---|---|
| Severity / Priority | Major / P2. The onboarding promises a warning for a budget the menu does not respect |
| Area | UI, DB |
| Linked case / AC | TC-17 / AC-11 |
| Status | Candidate, not confirmed with the PO |
| Evidence | [Menu, persona B](session-reports/screenshots/ui/05-local-vegano-menu.png) (estimated 94.95 EUR); `docs/session-reports/ui-session.md` section 5 (U-04) |
| Automated coverage | None |

Preconditions: persona B with a weekly budget of 35 EUR.

Steps:
1. In the onboarding set the weekly budget to 35 EUR, objective "save money", 1 adult.
2. Finish the onboarding and generate the menu.
3. Read the menu screens for a budget warning, then read the stored warnings of the menu.

Expected: a warning that the menu exceeds the budget.

Actual: the estimated cost is 94.95 EUR, no warning is displayed and the stored warnings are empty.

Note: the two cost figures may come from different calculations, which would make this a mismatch between estimate and rule rather than a missing rule.

## BUG-03 Recipe photo shows egg on a recipe without egg

| Field | Value |
|---|---|
| Severity / Priority | Minor / P3. Data is correct and the filter is not affected, but the photo contradicts the allergen data for an egg-allergic user |
| Area | UI |
| Linked case / AC | TC-18 / AC-1 |
| Status | Candidate, not confirmed with the PO |
| Evidence | [Menu, persona A](session-reports/screenshots/ui/04-local-alergia-menu.png); `docs/session-reports/ui-session.md` section 5 (U-05) |
| Automated coverage | None |

Preconditions: persona A (`ALERGIA`, declares `huevo`) with a generated menu.

Steps:
1. Log in as persona A and open the menu.
2. Find the recipe "Ensalada de kale con manzana".
3. Compare its photo with its ingredients and allergens.

Expected: the photo does not show a declared allergen that the recipe does not list.

Actual: the photo shows halved boiled eggs. The recipe lists kale, apple and walnuts, and its allergen is `frutos_de_cascara`. The image is an external stock photo.

## BUG-04 Menu generated mid-week leaves the past days empty

| Field | Value |
|---|---|
| Severity / Priority | Minor / P3. May be intended; the landing page promises 21 dishes from Monday to Sunday |
| Area | UI, API |
| Linked case / AC | TC-11 / AC-3 (PO question 6 in the plan) |
| Status | Candidate, not confirmed with the PO |
| Evidence | `docs/session-reports/ui-session.md` section 4 (12 of 21 slots, all three personas) and section 5 (U-03); `docs/session-reports/api-session.md` section 4 (E3: 21 of 21 for future weeks) |
| Automated coverage | Partial. `UI-TC-11` covers only the future-week half (21 slots, 14 distinct comida and cena names). The mid-week half was dropped on purpose because it depends on the run date and on the PO answer |

Preconditions: a persona with a completed profile; the current date is a Thursday of the week being generated.

Steps:
1. Log in as persona C (`FAMILIA`) on a Thursday.
2. Generate the menu for the current week.
3. Count the slots that hold a recipe.

Expected: 21 slots with a recipe, as promised, unless the PO confirms that past days stay empty.

Actual: 12 of 21 slots filled; Monday to Wednesday are empty. A menu for a future week, generated through the API, had 21 of 21.

## BUG-05 Inactive recipes are readable without a session

| Field | Value |
|---|---|
| Severity / Priority | Question / P3. Possibly an intended public catalogue; no private data is exposed |
| Area | API |
| Linked case / AC | none (PO question, `docs/session-reports/api-session.md` finding API-01) |
| Status | Candidate, not confirmed with the PO |
| Evidence | `docs/session-reports/api-session.md` sections 2, 3 and 5 |
| Automated coverage | None, by decision: it is a PO question and not a rule (`.context/PBI/epics/EPIC-DOJO-allergy-safe-menu/test-specs/api-menu-safety/spec.md`) |

Preconditions: the local stack running and the public API key; no session.

Steps:
1. Send `GET /rest/v1/recipes` with the public key and no user token.
2. Repeat with the filter `activo=false`.

Expected: unknown. Inactive recipes are withdrawn or unpublished, so the PO must say whether they should be public.

Actual: both calls return 200 and the second returns an inactive recipe.

## Summary

| ID | Title | Severity | Priority | Area | Case | Evidence level | Automated |
|---|---|---|---|---|---|---|---|
| BUG-01 | Vegan diet silently stores allergens | Major | P2 | UI, DB | TC-16 | One UI run, stored profile read in the DB | No |
| BUG-02 | No warning when the menu exceeds the budget | Major | P2 | UI, DB | TC-17 | One UI run, screenshot, stored warnings read in the DB | No |
| BUG-03 | Photo shows egg on a recipe without egg | Minor | P3 | UI | TC-18 | One UI run, screenshot | No |
| BUG-04 | Mid-week menu is partial (12 of 21) | Minor | P3 | UI, API | TC-11 | One UI run on all three personas, contrasted with the API | Partial (`UI-TC-11`, future week only) |
| BUG-05 | Inactive recipes readable anonymously | Question | P3 | API | none | One API run (script, not a test) | No |

## Dropped after verification

- Free-text allergen ignored by the filter (TC-13): not a defect on this evidence. The onboarding offers no free-text field for allergens and states that the free-text diet field is not used to filter (U-08 in `docs/session-reports/ui-session.md`). The only exposure is a profile written outside the UI, observed in the data (F-01 in `docs/session-reports/db-session.md`).

## What was not verified

- None of the five was confirmed with the PO or reproduced a second time.
- Staging: the captcha blocked every authenticated flow, so all UI evidence comes from the local stack.
- BUG-01: whether the summary screen lists the stored allergens, and which control adds them.
- BUG-02: whether the estimate and the budget rule use different calculations.
- Older menus in the shared database that contain a declared allergen (F-02, F-03 in `docs/session-reports/db-session.md`) are unresolved and are not listed as defects.
- Shopping list, slot swap, profile edits after generation, account deletion and export were not exercised.
