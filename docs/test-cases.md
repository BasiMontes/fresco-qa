# Test cases: Allergy-safe weekly menu

Cases are written from `docs/feature-test-plan.md`. Traceability to criteria, automated checks and defects is in `docs/traceability-matrix.md`. Status values: Designed, Executed, Automated, Partial, Blocked.

## Case template

Every case below uses these fields, in this order:

- Heading: `TC-NN Title`, written as the expected behaviour.
- Automated check: ATC ids and level, or none. Status. Defect: the bug it surfaced, or none.
- Covers: acceptance criteria, persona, priority, technique and automation level.
- Preconditions: the state needed before step 1.
- Steps: numbered, or one line when trivial.
- Expected: observable result that decides pass or fail.
- Evidence, Observed, Related finding: only when the case was executed.

Legend. Priority: P1 must run before release, P2 should run, P3 nice to have. Automation: UI for Playwright in the browser, API for requests without a browser, DB for a read-only check, Manual for exploratory work.

## Summary

| ID | Title | AC | Type | Priority | Automation | Status |
|---|---|---|---|---|---|---|
| TC-01 | Egg-allergic couple gets a menu without egg recipes | AC-1 | Positive | P1 | UI + DB | Executed once, passed |
| TC-02 | Repeated generations never include an egg recipe | AC-1 | Negative | P1 | API + DB | Partial: 2 menus, no egg; limited to 5 per hour |
| TC-03 | Vegan and lactose-free profile gets only matching recipes | AC-2 | Positive | P1 | UI + DB | Partial: menu checked, shopping list not |
| TC-04 | Several allergens exclude the union of all of them | AC-1 | Decision table | P1 | API + DB | Designed; automated as API ATC TC-04 |
| TC-05 | Declaring lupin is accepted and the menu still generates | AC-1 | Edge | P3 | UI | Automated as UI ATC UI-TC-05 |
| TC-06 | A very restrictive profile stays safe even if variety drops | AC-1, AC-3 | Edge | P2 | Manual | Designed |
| TC-07 | Shopping list quantities scale with household size | AC-5 | Boundary | P2 | UI | Designed |
| TC-08 | Household size limits are enforced | AC-6 | Boundary | P2 | API | Designed |
| TC-09 | Swapping one slot changes only that slot and stays safe | AC-4 | Positive | P1 | UI | Automated as UI ATC UI-TC-09 |
| TC-10 | Adding an allergen after generation does not leave unsafe slots | AC-7 | State transition | P1 | API | Automated as API ATC TC-10 |
| TC-11 | A normal profile gets 21 slots with no repeated comida or cena | AC-3 | Positive | P2 | UI + DB | Partial: no repeats, 12 of 21 filled |
| TC-12 | Deleting the account removes the health data | AC-8 | Positive | P2 | UI + DB | Automated |
| TC-13 | A free-text allergy is honoured or the user is warned | AC-9 | Negative | P2 | Manual | Designed |
| TC-14 | A Free user can use diet and allergy filters | AC-10 | Positive | P2 | UI | Designed |
| TC-15 | A user cannot request another user's filtered recipes | Security | Negative | P1 | API | Executed once, passed |
| TC-16 | Choosing a vegan diet does not silently add allergens | AC-1, AC-8 | Negative | P2 | UI + DB | Automated; retest passed (QAFRESCO-29, QAFRESCO-37) |
| TC-17 | A menu over the weekly budget shows a warning | AC-11 | Negative | P2 | UI + DB | Automated; retest passed for the current and next week (QAFRESCO-2, QAFRESCO-36) |
| TC-18 | Recipe photos do not contradict the allergen data | AC-1 | Exploratory | P3 | Manual | Executed once, defect filed and closed (QAFRESCO-30); full case not repeated |

## Case details

### TC-01 Egg-allergic couple gets a menu without egg recipes
- Automated check: `TC-01` (API), `UI-TC-01` (UI). Status: Executed once, passed; automated. Defect: none.
- Covers: AC-1. Persona A. Priority P1. Automation: UI then a read-only database check.
- Preconditions: account A exists with 2 adults and the allergen `huevo` declared.
- Steps:
  1. Log in as persona A.
  2. Generate the weekly menu.
  3. Read the name of each of the 21 recipes.
  4. In the database, read the allergen array of each of those recipes.
- Expected: no recipe has `huevo` in its allergen array, and the menu has 21 slots.
- Evidence: screenshot of the menu and the query result.
- Related finding: F-02.

### TC-02 Repeated generations never include an egg recipe
- Automated check: `TC-02` (API). Status: Partial; automated for 2 weeks per run. Defect: none.
- Covers: AC-1. Persona A. Priority P1. Automation: API and database.
- Preconditions: as TC-01, and an authenticated session for persona A.
- Steps:
  1. Generate a menu for each of several different future weeks. The same week returns 409 and a user and week always give the same menu, so repeating one week proves nothing.
  2. After each, check the recipes against the allergen array.
- Expected: zero slots with `huevo` in every menu, "Ensalada cesar" included.
- Limit: menu generation allows 5 requests per hour per user, so one hour covers at most 5 weeks.
- Note: this is the regression check for F-02. It ran once with 2 weeks and found no egg recipe.

### TC-03 Vegan and lactose-free profile gets only matching recipes
- Automated check: `TC-03` (API), `UI-TC-03` (UI). Status: Partial; automated, shopping list not checked. Defect: none.
- Covers: AC-2. Persona B. Priority P1. Automation: UI and database.
- Preconditions: account B with vegano and sin lactosa active.
- Steps: generate the menu; for each recipe read the `dieta` flags.
- Expected: every recipe has `vegano` and `sin_lactosa` true. The shopping list has no meat, fish, dairy or egg item.

### TC-04 Several allergens exclude the union of all of them
- Automated check: `TC-04` (API). Status: Automated. Defect: none.
- Covers: AC-1. Decision table. Priority P1. Automation: API and database.
- Data table (use a throwaway profile change on a test account, then restore it):

| Declared | Expected excluded |
|---|---|
| huevo | recipes tagged huevo |
| huevo + pescado | tagged huevo or pescado |
| huevo + pescado + frutos_de_cascara + soja | tagged with any of the four |

- Expected: for each row, zero slots carry any declared allergen.

### TC-05 Declaring lupin is accepted and the menu still generates
- Automated check: `UI-TC-05` (UI). Status: Automated. Defect: BUG-10 (QAFRESCO-32, closed).
- Covers: AC-1. Edge. Priority P3. Automation: UI.
- Steps: declare `altramuces`; generate a menu.
- Expected: the profile is saved and the menu has 21 slots. The exclusion cannot be verified because no recipe carries the tag (F-06).
- Retest 2026-11-26, local run at `fresco-app` `096f47b2`: no active recipe named lupin. With a recipe tagged inside a rolled back transaction, a profile declaring `altramuces` no longer got it.

### TC-06 A very restrictive profile stays safe even if variety drops
- Automated check: none. Status: Designed. Defect: none.
- Covers: AC-1, AC-3. Edge. Priority P2. Automation: manual, exploratory.
- Steps: set vegano, sin gluten, sin lactosa and three allergens; generate the menu.
- Expected: no recipe violates any restriction. Either the menu is complete, or the app says that there are not enough recipes. A silent menu with unsafe recipes is a defect. Record whether comida or cena repeat (F-04).

### TC-07 Shopping list quantities scale with household size
- Automated check: none. Status: Designed. Defect: none.
- Covers: AC-5. Boundary. Priority P2. Automation: UI.
- Steps: compare the list for persona C (4 people) with a 1-person profile on the same recipes.
- Expected: quantities grow in proportion to the number of people. The product scales by the number of people only, so a child counts as an adult (improvement QAFRESCO-35).

### TC-08 Household size limits are enforced
- Automated check: `TC-08-1`, `TC-08-2` (API). Status: Automated; row 4/1/0 not tested (the database accepts it, the app cannot produce it). Defect: BUG-12 for the total above 10 in the onboarding (fixed, retest passed 2026-11-26).
- Covers: AC-6. Boundary. Priority P2. Automation: API.
- Data table:

| People | Adults | Children | Expected |
|---|---|---|---|
| 1 | 1 | 0 | accepted |
| 10 | 10 | 0 | accepted |
| 11 | 10 | 1 | rejected |
| 0 | 0 | 0 | rejected |
| 2 | 3 | 0 | rejected |
| 4 | 1 | 0 | accepted by the database; the app derives the total, so it cannot be produced from the app (F-05). Not tested |
| 8 | 8 | 5 | UI: rejected on the household step with the limit message since the fix of BUG-12 (retest 2026-11-26). Not automated yet |

### TC-09 Swapping one slot changes only that slot and stays safe
- Automated check: `UI-TC-09` (UI). Status: Automated. Defect: none (the FAQ promise of regenerating one slot was BUG-11, closed on 2026-11-26 after the text changed).
- Covers: AC-4. Persona A. Priority P1. Automation: UI.
- Steps: generate; note the 21 recipes; swap one slot; compare.
- Expected: exactly one slot changed, and the new recipe has no `huevo`.

### TC-10 Adding an allergen after generation does not leave unsafe slots
- Automated check: `TC-10` (API), a step of the generation test for the egg-allergic persona. Status: Automated. Defect: none.
- Covers: AC-7. State transition. Priority P1. Automation: API.
- Steps:
  1. As persona A, generate a menu while only `huevo` is declared.
  2. Add an allergen carried by at least one slot of the menu (the test picks the least frequent one, for example `pescado`).
  3. Read the menu again.
- Expected (confirmed by the PO): every slot that carried the new allergen is back to `pendiente` with no recipe, the other slots keep their recipe, no slot carries the allergen, and the plan has the notice "Hemos quitado de tu menú ... que ya no encaja(n) con tu perfil" with the number of slots taken out (F-03).

### TC-11 A normal profile gets 21 slots with no repeated comida or cena
- Automated check: `UI-TC-11` (UI). Status: Partial; automated for a future week. Defect: none (BUG-04 was by design).
- Covers: AC-3. Persona C. Priority P2. Automation: UI and database.
- Steps: generate a menu on a Monday and again on a later day of another week; count slots with a recipe; look for repeated comida or cena among real recipes.
- Expected: no repeats. On a Monday, 21 slots with a recipe. Mid-week, the days already past are empty by design: the PO confirmed that weeks start on Monday.
- Observed in a local run: a menu created on a Thursday had 12 slots with a recipe and 9 empty (Monday to Wednesday). Two menus for future weeks, made through the API, had all 21 slots filled.

### TC-12 Deleting the account removes the health data
- Automated check: `UI-TC-12-1`, `UI-TC-12-2`, `UI-TC-12-3` (UI). Status: Automated. Defect: none.
- Covers: AC-8. Priority P2. Automation: UI and a read-only database check.
- Preconditions: a spare account created only for this case.
- Steps: declare an allergy; delete the account; query the profile row.
- Expected: no profile, menu or consent row remains, and an erasure record exists under a hash of the user id. The id may be stored in clear only while its deletion in the analytics service is pending, so it can be retried (owner, 2026-11-27).

### TC-13 Free text is flagged as not used for filtering
- Automated check: none. Status: Designed. Defect: none.
- Covers: AC-9. Priority P2. Automation: UI.
- Steps: in the diet step of the onboarding, write "sin kiwi" in the free-text diet field, finish the onboarding and generate a menu.
- Expected: the screen states that the text is not used to filter, and the menu is the same as with the field empty. The onboarding has no free-text field for allergens (F-01).

### TC-14 A Free user can use diet and allergy filters
- Automated check: `UI-TC-14` (UI). Status: Automated. Defect: none.
- Covers: AC-10. Priority P2. Automation: UI.
- Steps: with a Free account, set a diet and an allergen.
- Expected: both can be set without a paywall.

### TC-15 A user cannot request another user's filtered recipes
- Automated check: `TC-15` (API). Status: Executed once, passed; automated. Defect: none.
- Covers: security. Priority P1. Automation: API.
- Steps: with persona A's token, call `get_filtered_recipes` with persona B's user id.
- Expected: the call fails with "caller does not own profile".

### TC-16 Choosing a vegan diet does not silently add allergens
- Automated check: `UI-TC-16-1`, `UI-TC-16-2`, `UI-TC-16-3`, `UI-TC-16-4` (UI). Status: Automated. Defect: BUG-01 (QAFRESCO-29, closed); related BUG-14 (QAFRESCO-37, closed).
- Covers: AC-1, AC-8. Persona B in the manual runs; the ATCs sign up a new account in each test. Priority P2. Automation: UI and database.
- Steps: sign up, choose only the diets vegano and sin lactosa and no allergen, tick the consent, finish the onboarding, read the summary and the stored profile.
- Expected: no allergen is stored unless it contradicts the diet (PO, 2026-11-23): `huevo` and `pescado` are accepted for a vegan diet, `sulfitos` is not.
- Observed in a local run: the stored profile had `pescado`, `sulfitos` and `huevo` that the test did not select, and the diet step showed them as selected. Whether the user sees them in the summary was not checked.
- Retest 2026-11-26, local run at `fresco-app` `04ee5c6d`: passed. The vegan profile stored only `pescado` and `huevo`, vegetarian locked only `pescado`, and a stored `sulfitos` could be removed in the preferences. Turning a diet off kept its allergen (BUG-14).
- Retest of BUG-14 on 2026-11-27, local run at `fresco-app` `08dda5d6`: a diet switched on and off in one edit left none of its allergens, in the preferences and in the onboarding; a saved allergen stayed, unlocked. A `sulfitos` chosen by hand survived. TC-16 itself was not executed again.

### TC-17 A menu over the weekly budget shows a warning
- Automated check: `UI-TC-17-1`, `UI-TC-17-2`, `UI-TC-17-3` (UI). Status: Automated. Defects: BUG-02 (QAFRESCO-2, closed); BUG-13 (QAFRESCO-36, closed).
- Covers: AC-11. Persona B in the manual runs; the ATCs use `presupuesto` (two adults, no diet). Priority P2. Automation: UI and database.
- Steps: set a weekly budget lower than the estimated cost of a menu, generate it, read the menu screens and the stored warnings.
- Expected: a warning that the menu exceeds the budget, as the onboarding promises.
- Observed in a local run: budget 35 EUR, estimated cost 94.95 EUR, no warning displayed and no warning stored. The two cost figures may come from different calculations.
- Retest 2026-11-26, local run at `fresco-app` `04ee5c6d`: for the current week the warning matched the estimated cost minus the budget (127.82 minus 35 gave 92.82 EUR), appeared with a budget 0.01 EUR below the cost and not with one equal to or above it. The next week's menu showed no warning (BUG-13).
- Retest 2026-11-27, local run at `fresco-app` `08dda5d6`, 10 adults and a budget of 35 EUR: the next week's calendar warned on first load (449.84 EUR over). There was no warning with 600 EUR or with 484.84 EUR (the cost), and 0.01 EUR was reported with 484.83. The current week cost 248.90 EUR and warned 213.90 over. A past week kept its stored warning.

### TC-18 Recipe photos do not contradict the allergen data
- Automated check: none. Status: Executed once, defect filed. Defect: BUG-03 (QAFRESCO-30, closed).
- Covers: AC-1. Persona A. Priority P3. Automation: manual.
- Steps: for each recipe in the menu of an allergic persona, compare the photo with the recipe's ingredients and allergens.
- Expected: no photo shows a declared allergen that the recipe does not list.
- Observed in a local run: "Ensalada de kale con manzana" shows halved boiled eggs in an external stock photo, while its ingredients are kale, apple and walnuts.
- On 2026-11-26 the photo in the hosted database showed no egg; the seed data still pointed to the old photo. The case was not executed again.
- Retest 2026-11-27, local run at `fresco-app` `08dda5d6`: the two reviewed photos showed no egg and no prawns. The case over every recipe of a menu was not executed again.

## Notes on execution

- Cases marked UI depend on the Turnstile check being passable from automation (risk R1 in the test plan).
- Manual database checks use read-only queries on the shared project and never write. The automated account deletion checks read the local stack.
- Defects go in the bugs report only after the case is executed and the PO question, if any, is answered.
