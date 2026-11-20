# Database testing session

| Field | Value |
|---|---|
| Date | 2026-11-19 |
| Tool | Supabase MCP (`list_projects`, `list_tables`, `execute_sql`) |
| Project | `Fresco` (single Supabase project, region eu-west-1, Postgres 17) |
| Access | Read-only. Only `SELECT` statements and catalog reads were run |
| Charter | Check that the data model and the stored data support the feature "allergy-safe weekly menu" |

## 1. Constraints of this session

- The database is shared by every environment (dev, staging, production). Nothing could be written, and rows cannot be attributed to an environment.
- User identifiers are shortened to four characters in this report. No emails or free-text fields were read.
- The dataset is small: 7 profiles and 20 menus. Findings about behaviour are candidates to reproduce in the UI, not confirmed defects.

## 2. What the data model looks like

32 tables in `public`, all with row level security enabled. The ones that matter for this feature:

| Table | Rows | Role |
|---|---|---|
| `recipes` | 1287 (658 active) | Catalogue. `alergenos` is a JSON array of text, `dieta` is a JSON object of booleans |
| `user_profiles` | 7 | Household, diets as booleans, `alergenos` as a text array, plus free-text fields |
| `meal_plans` | 20 | One menu per user per ISO week |
| `meal_plan_recipes` | 420 | One row per slot: day, meal type, state |
| `user_consents`, `account_erasures` | 25, 5 | Consent registry and erasure log |

The selection logic lives in the function `get_filtered_recipes(p_user_id, p_recipe_id)`:

- It refuses a caller who is not the owner of the profile.
- It keeps a recipe only if none of its allergens matches a declared one, comparing lowercase on both sides, so it fails closed.
- It requires every active diet flag to be true on the recipe, and treats a missing flag as false.
- It also excludes recipes whose main ingredients match a disliked ingredient by exact name.

## 3. Checks run and results

| # | Check | Result |
|---|---|---|
| 1 | Allergen vocabulary on active recipes | 13 values. `altramuces` (lupin) is never used, although a profile may declare it |
| 2 | Active recipes with no allergen tag | 165 of 658 (25 percent). Plausible for salads and vegetables, not checked one by one |
| 3 | Vegan recipes tagged with lactosa, huevo, pescado, crustaceos or moluscos | 0 |
| 4 | `sin_lactosa` recipes tagged `lactosa` | 0 |
| 5 | `sin_gluten` recipes tagged `gluten` | 0 |
| 6 | `sin_huevo` recipes tagged `huevo` | 0 |
| 7 | Vegan recipes that are not vegetarian | 0 |
| 8 | Allergen mentioned in the ingredient list but missing from the tag | 4 gluten and 25 lactosa hits, none confirmed as a defect (see below) |
| 9 | Vegetarian recipes with a meat or fish ingredient | 8 hits, all explained below |
| 10 | Menus with 21 slots | 20 of 20. 140 slots of each meal type |
| 11 | Menus where the same comida or cena appears twice | 2 of 20 (same user), see F-04 |
| 12 | Slots whose recipe violates a diet, with the profile unchanged since the menu was made | 0 |
| 13 | Slots containing a declared allergen | 11, see F-02 and F-03 |
| 14 | Profiles whose adults plus children differ from people | 0 of 7 |

Explanation of the text-search hits (checks 8 and 9): the search was a rough text match and produced false positives. The 4 gluten cases are corn arepas and "pan sin gluten" sandwiches, which are correct. The 8 vegetarian hits are matches of "pollo" inside "repollo" (cabbage). The 25 lactose hits are recipes with coconut milk or coconut, and one almond-milk smoothie that was checked. The 25 were not verified one by one, so none is reported as a defect.

Method note: a first version of checks 4 and 3 used the wrong tag name (`lacteos` instead of `lactosa`) and returned zero for the wrong reason. They were rewritten with the real vocabulary and the results above come from the corrected queries.

## 4. Findings

None is a confirmed defect. Each has a case in `docs/test-cases.md` to confirm it through the UI.

| ID | Type | Finding | Evidence | Next step |
|---|---|---|---|---|
| F-01 | Observation | The free-text allergy column (`alergenos_texto_libre`) is never read by the filter function. The onboarding offers no free-text field for allergens and says that free-text diet is not used to filter, so the exposure is limited to profiles written outside the UI | Function definition; later UI run | TC-13: check the warning in the UI |
| F-02 | Candidate defect | A menu generated 1.5 seconds after a profile declaring `huevo` contains "Ensalada cesar", tagged `huevo`, in state `pendiente` | Plan created 08-27 21:48:12.968, profile saved 21:48:11.447 | TC-01, TC-02: regenerate several times on the current build. The menu may predate a later fix |
| F-03 | Candidate defect | 10 pending slots in two older menus contain `pescado` or `huevo`, which the profile of that user declares. The profile was last updated after those menus, so the allergens were probably added later, but the data does not say when | Profile updated 11-09, menus from 09-04 and 09-28, slots `pendiente`, no warning stored | TC-10, AC-7. Question 2 to the PO |
| F-04 | Candidate defect | "Ensalada de quinoa" appears twice as comida in two different weeks of one user, which contradicts the promise of no repeated comida or cena | Weeks 2026-W38 (Monday and Saturday) and 2026-W40 (Monday and Sunday) | TC-11, TC-06. A narrow profile may force repeats |
| F-05 | Gap | The database enforces people from 1 to 10 and adults at most equal to people, but not that adults plus children equal people | Constraint list on `user_profiles` | TC-08. Question 1 to the PO |
| F-06 | Observation | `altramuces` can be declared but no recipe carries it, so declaring it can never exclude anything | Vocabulary check against the profile constraint | Question 5 to the PO. Not testable until a recipe is tagged |
| F-07 | Observation | 629 of 1287 recipes (49 percent) are inactive, so the usable pool for a narrow profile is smaller than it looks | `activo` count | Feeds the risk of repeats in TC-06 |

Counts that held up well: no vegan recipe carries an animal allergen, no gluten-free or lactose-free recipe carries the opposite tag, and no menu with a stable profile violates a diet.

## 5. Not covered

- Which rows belong to which environment.
- Shopping list content and quantities (`shopping_lists`): not inspected in this session.
- Row level security behaviour per role: needs authenticated API calls, planned for the API session.
- Free-text and any other personal data, deliberately not read.
