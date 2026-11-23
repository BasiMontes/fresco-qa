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
| TC-05 | Declaring lupin is accepted and the menu still generates | AC-1 | Edge | P3 | UI | Designed |
| TC-06 | A very restrictive profile stays safe even if variety drops | AC-1, AC-3 | Edge | P2 | Manual | Designed |
| TC-07 | Shopping list quantities scale with household size | AC-5 | Boundary | P2 | UI | Designed |
| TC-08 | Household size limits are enforced | AC-6 | Boundary | P2 | API | Designed |
| TC-09 | Swapping one slot changes only that slot and stays safe | AC-4 | Positive | P1 | UI | Designed |
| TC-10 | Adding an allergen after generation does not leave unsafe slots | AC-7 | State transition | P1 | Manual | Designed |
| TC-11 | A normal profile gets 21 slots with no repeated comida or cena | AC-3 | Positive | P2 | UI + DB | Partial: no repeats, 12 of 21 filled |
| TC-12 | Deleting the account removes the health data | AC-8 | Positive | P2 | UI + DB | Designed |
| TC-13 | A free-text allergy is honoured or the user is warned | AC-9 | Negative | P2 | Manual | Designed |
| TC-14 | A Free user can use diet and allergy filters | AC-10 | Positive | P2 | UI | Designed |
| TC-15 | A user cannot request another user's filtered recipes | Security | Negative | P1 | API | Executed once, passed |
| TC-16 | Choosing a vegan diet does not silently add allergens | AC-1, AC-8 | Negative | P2 | UI + DB | Executed once, candidate finding |
| TC-17 | A menu over the weekly budget shows a warning | AC-11 | Negative | P2 | UI + DB | Executed once, candidate finding |
| TC-18 | Recipe photos do not contradict the allergen data | AC-1 | Exploratory | P3 | Manual | Executed once, candidate finding |

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
- Automated check: none. Status: Designed. Defect: none.
- Covers: AC-1. Edge. Priority P3. Automation: UI.
- Steps: declare `altramuces`; generate a menu.
- Expected: the profile is saved and the menu has 21 slots. The exclusion cannot be verified because no recipe carries the tag (F-06).

### TC-06 A very restrictive profile stays safe even if variety drops
- Automated check: none. Status: Designed. Defect: none.
- Covers: AC-1, AC-3. Edge. Priority P2. Automation: manual, exploratory.
- Steps: set vegano, sin gluten, sin lactosa and three allergens; generate the menu.
- Expected: no recipe violates any restriction. Either the menu is complete, or the app says that there are not enough recipes. A silent menu with unsafe recipes is a defect. Record whether comida or cena repeat (F-04).

### TC-07 Shopping list quantities scale with household size
- Automated check: none. Status: Designed. Defect: none.
- Covers: AC-5. Boundary. Priority P2. Automation: UI.
- Steps: compare the list for persona C (4 people) with a 1-person profile on the same recipes.
- Expected: quantities grow with the number of people. Record the ratio; the exact rule is not documented.

### TC-08 Household size limits are enforced
- Automated check: `TC-08-1`, `TC-08-2` (API). Status: Automated; row 4/1/0 excluded. Defect: none.
- Covers: AC-6. Boundary. Priority P2. Automation: API.
- Data table:

| People | Adults | Children | Expected |
|---|---|---|---|
| 1 | 1 | 0 | accepted |
| 10 | 10 | 0 | accepted |
| 11 | 10 | 1 | rejected |
| 0 | 0 | 0 | rejected |
| 2 | 3 | 0 | rejected |
| 4 | 1 | 0 | open question: the database accepts it (F-05) |

### TC-09 Swapping one slot changes only that slot and stays safe
- Automated check: none. Status: Designed. Defect: none.
- Covers: AC-4. Persona A. Priority P1. Automation: UI.
- Steps: generate; note the 21 recipes; swap one slot; compare.
- Expected: exactly one slot changed, and the new recipe has no `huevo`.

### TC-10 Adding an allergen after generation does not leave unsafe slots
- Automated check: none. Status: Designed. Defect: none.
- Covers: AC-7. State transition. Priority P1. Automation: manual.
- Steps:
  1. As persona A, generate a menu while only `huevo` is declared.
  2. Add the allergen `pescado` in the profile.
  3. Open the current menu.
- Expected: pending slots with a fish recipe are replaced or the user is warned. Otherwise report it. Needs PO confirmation (F-03).

### TC-11 A normal profile gets 21 slots with no repeated comida or cena
- Automated check: `UI-TC-11` (UI). Status: Partial; automated for a future week. Defect: BUG-04.
- Covers: AC-3. Persona C. Priority P2. Automation: UI and database.
- Steps: generate a menu on a Monday and again on a later day of another week; count slots with a recipe; look for repeated comida or cena among real recipes.
- Expected: no repeats. On a Monday, 21 slots with a recipe. Mid-week, the days already past are empty, which needs PO confirmation (question 6 of the plan).
- Observed in a local run: a menu created on a Thursday had 12 slots with a recipe and 9 empty (Monday to Wednesday). Two menus for future weeks, made through the API, had all 21 slots filled.

### TC-12 Deleting the account removes the health data
- Automated check: none. Status: Designed. Defect: none.
- Covers: AC-8. Priority P2. Automation: UI and a read-only database check.
- Preconditions: a spare account created only for this case.
- Steps: declare an allergy; delete the account; query the profile row.
- Expected: no profile row remains, and an erasure record exists without the user id in clear text.

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
- Automated check: none. Status: Executed once, candidate finding. Defect: BUG-01.
- Covers: AC-1, AC-8. Persona B. Priority P2. Automation: UI and database.
- Steps: sign up, choose only the diets vegano and sin lactosa and no allergen, tick the consent, finish the onboarding, read the summary and the stored profile.
- Expected: either no allergen is stored, or the summary shows each one the user did not choose. Needs PO confirmation.
- Observed in a local run: the stored profile had `pescado`, `sulfitos` and `huevo` that the test did not select, and the diet step showed them as selected. Whether the user sees them in the summary was not checked.

### TC-17 A menu over the weekly budget shows a warning
- Automated check: none. Status: Executed once, candidate finding. Defect: BUG-02.
- Covers: AC-11. Persona B. Priority P2. Automation: UI and database.
- Steps: set a weekly budget lower than the estimated cost of a menu, generate it, read the menu screens and the stored warnings.
- Expected: a warning that the menu exceeds the budget, as the onboarding promises.
- Observed in a local run: budget 35 EUR, estimated cost 94.95 EUR, no warning displayed and no warning stored. The two cost figures may come from different calculations.

### TC-18 Recipe photos do not contradict the allergen data
- Automated check: none. Status: Executed once, candidate finding. Defect: BUG-03.
- Covers: AC-1. Persona A. Priority P3. Automation: manual.
- Steps: for each recipe in the menu of an allergic persona, compare the photo with the recipe's ingredients and allergens.
- Expected: no photo shows a declared allergen that the recipe does not list.
- Observed in a local run: "Ensalada de kale con manzana" shows halved boiled eggs in an external stock photo, while its ingredients are kale, apple and walnuts.

## Notes on execution

- Cases marked UI depend on the Turnstile check being passable from automation (risk R1 in the test plan).
- Database checks use read-only queries on the shared project and never write.
- Defects go in the bugs report only after the case is executed and the PO question, if any, is answered.
