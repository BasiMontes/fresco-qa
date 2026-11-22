# ATC UI-TC-09: replaceOpenMealSlotFromLibrary

| Field | Value |
|---|---|
| Component | `RecipesPage` (`tests/components/ui/RecipesPage.ts`, new) |
| Type | UI, Mutation, hybrid (API setup and readback) |
| Source | TC-09, AC-4 (flow chosen: add to menu; see PO-1 in `spec.md`) |
| Fixture and persona | `{ test }`, `familia` with `huevo` written to its profile for the run; API side `fixture.api.asRole('familia')` |
| Routes | `/recipes?q=<name>` then the dialog `add_to_menu_dialog` on the same page |
| Signature | `replaceOpenMealSlotFromLibrary({ name })` returns the text shown as the current recipe of the chosen option (`Ahora: ...`), for the test-level cross-check |
| Technique | EP valid partition (open `pendiente` slot, same `tipo_plato`, safe recipe) |
| Test file | `tests/e2e/menu-safety/replaceMealSlotFromLibrary.test.ts`; title `UI-TC-09: should change only the chosen slot and keep it egg-free when a safe recipe is added from the library` |

## Selectors and routes (evidence; none verified live)

| Element | Selector | Evidence |
|---|---|---|
| Library search | route `/recipes?q=`; input `recipe_search_input` | `app/(app)/recipes/page.tsx` line 51; `components/recipes/recipe-library.tsx` line 201 |
| Result grid | `recipe_library_grid` | `recipe-library.tsx` line 351 |
| Card of a recipe | a link `/recipes/<id>` in the grid, filtered by the recipe name text | `recipe-library.tsx` lines 353 to 363. The name element inside the card is not read: filter by text, unverified |
| Add button | `recipe_card_add_to_menu_button` inside that card | `components/recipe/recipe-card.tsx` line 90 |
| Dialog | `add_to_menu_dialog`; loading `add_to_menu_loading` (must disappear); empty `add_to_menu_empty_state` | `add-to-menu-dialog.tsx` lines 116, 133, 146 |
| Slot options | radios `add_to_menu_slot_option`; the parent label holds the day, the type and `Ahora: <recipe>` or `Sin receta` | lines 163 to 176. Reading the label through the radio's parent is unverified |
| Confirm | `add_to_menu_confirm_button` (enabled only after an option is selected) | line 226 |
| Success | `add_to_menu_success`, text contains the recipe name | line 188 |
| Failure | `add_to_menu_error` | line 184 |
| Login and tour | `PROJ-111` `LoginPage.loginSuccessfully`; `dismissTourOverlayWhenShown` | existing |

The slot id is not visible in the UI. The changed slot is found by the database diff, not by the UI.

## Fixed assertions (inside the ATC)

- The card for `name` is visible in the grid (zero cards fails with the name).
- Add button click opens `add_to_menu_dialog`; `add_to_menu_loading` hidden; `add_to_menu_empty_state` not visible (an empty list means no open `comida` slot today or later, a failed precondition).
- First option selected, `add_to_menu_confirm_button` enabled, click.
- `add_to_menu_success` visible and contains `name`; `add_to_menu_error` not visible.

## Test-level assertions (the "only that slot and stays safe" proof)

Setup, all through the API: profile `alergenos = ['huevo']`; current-week menu generated (1 generation); `before = readMenuForWeek` (21 rows with id, recipe_id, dia, tipo_plato, estado, recipe name and allergens); recipe `chosen` from the RPC for `comida`, name unique in the safe list, id not in `before`.

After the ATC, `after = readMenuForWeek`:

| # | Assertion | Can fail because |
|---|---|---|
| 1 | `before.rows` and `after.rows` have 21 rows and the same ids | rows added or lost |
| 2 | The rows whose `recipe_id` differs are exactly one (`toHaveLength(1)`); the other 20 are identical in `recipe_id` and `estado` | the action touched another slot |
| 3 | The changed row has `tipo_plato` `'comida'` and `recipe_id` equal to the chosen id | wrong slot type or wrong recipe |
| 4 | The changed row's previous recipe name equals the `Ahora:` text read from the dialog | UI and DB disagree about which slot |
| 5 | The new stored recipe's `alergenos` does not contain the literal `'huevo'` | an unsafe recipe was stored |
| 6 | The changed row's `dia` is today or later (Madrid) | a past-day slot was written (guard defect) |

Not a `waitFor` anywhere: dialog states are awaited through `expect` on visible elements.

## Data

| Mode | Detail |
|---|---|
| Create | One current-week menu for `familia` through `generateMenuForWeek(currentIsoWeekInMadrid())`; 1 generation, wrapped in `runUnlessRateLimited` (429: NOT RUN locally, failure in CI) |
| Modify | `familia` profile (`alergenos`), one slot of the menu |
| Precondition | No menu for the current week or later (`expectNoMenusFromWeek`); never delete a menu the test did not create |
| Cleanup | `finally`: `deleteMenuForWeek(currentWeek)` with leftovers asserted `[]`, then profile restore. Cleanup failures are annotated and never mask the original failure |
| CI | Fresh DB: no menu, empty profile, nothing else needed. The test creates every state it needs |

Quota: +1 generation for `familia` (2 of 5 today, 3 of 5 after). `alergia` and `vegano` untouched. Tag: none (a `@critical` tag would send it to `smoke-ui` and spend quota on every smoke run; owner decides).

## Not covered / deferred

- Drag-to-reorder flow (two slots change, no new recipe; dnd-kit pointer activation unverified).
- Refusal path: an egg recipe sent to `assign_recipe_to_slot` should fail with `recipe is not available for this profile` and leave the slot unchanged (candidate API sibling `TC-09-2`, owner decision Q4).
- Slots in `sustituida`, `cocinada`, `descartada`, `excluida`, past days, and a recipe of another `tipo_plato`: all rejected by the RPC (lines 66 to 90 of `20261009120000_assign_recipe_to_slot.sql`), not exercised from the UI.
- Shopping list staleness notice `add_to_menu_stale_list_notice`.
