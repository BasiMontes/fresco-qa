# Test Automation Plan: menu-safety-p1-gaps

> Scope: module-driven, Medium. TC-04 (API) and TC-09 (UI with API setup and readback). Created 2026-11-22. Status: Phase 1 plan, awaiting owner approval. No code written.
> Facts come from `docs/test-cases.md`, `docs/session-reports/*`, the two existing plans (`api-menu-safety`, `ui-menu-safety`) and the product source read-only. "Unverified" marks anything not seen in a live run.

## 1. Waived gates (same owner decisions as the two existing plans)

Jira TC source gate, signed ROI verdicts, business context maps, `/test-framework-adaptation`, TMS sync: waived. KATA layers, ATC rules, lint, types, review: fully applied.

## 2. Readiness (checked read-only on 2026-11-22)

| Service | Check | Result |
|---|---|---|
| App `http://localhost:3000` | `curl` status | 000 (down) |
| Supabase `http://127.0.0.1:54321` | `curl` `/auth/v1/health` | 000 (down) |
| Everything else | Not checked | Unverified. Nothing was started or stopped |

## 3. Anti-duplication (`kata-manifest.json`, read 2026-11-22)

| Proposed id | Present? | Decision |
|---|---|---|
| `TC-04` | No. Existing API ids: `TC-01`, `TC-02`, `TC-03`, `TC-08-1`, `TC-08-2`, `TC-15`, `CHK-*`, `PROJ-*` | Free; follows the suite convention. One id, one method; the six rows call the same method from the test file (precedent `TC-08-1`) |
| `UI-TC-09` | No. Existing UI ids: `UI-TC-01`, `UI-TC-03`, `UI-TC-11`, `UI-TC-14` | Free |
| Behaviour overlap | `CHK-B2-1` already asserts "RPC result has no declared allergen" for the STORED profile of `alergia` and `vegano` | `TC-04` is not a duplicate: it varies the declared set (it writes the profile), checks the union with the catalogue oracle, and checks over-exclusion. It does not reuse `CHK-B2-1` (an ATC never calls an ATC) |

## 4. Components (Layer 3 and below)

| Component | File | Action | New members | Notes |
|---|---|---|---|---|
| `RecipesApi` | `tests/components/api/RecipesApi.ts` | Extend | ATC `TC-04` `getFilteredRecipesExcludeEveryDeclaredAllergen`; `@step` `listSafeRecipesOfType`; private catalogue helpers | The RPC and the catalogue both live here |
| `ProfilesApi` | `tests/components/api/ProfilesApi.ts` | Extend | `@step` `setDietaryPreferences(preferences)` | A PATCH of `alergenos` and the 7 `dieta_*` flags. `restoreDietaryPreferences` is the same call; kept untouched (surgical rule), a later chore may merge them |
| `MealPlansApi` | `tests/components/api/MealPlansApi.ts` | Extend | `@step` `expectNoMenusFromWeek(week)`; `MenuRecipeRow` and the `getMealPlanRecipes` select gain `estado` | The precondition guards the retire trigger (section 6) |
| `RecipesPage` | `tests/components/ui/RecipesPage.ts` | New | ATC `UI-TC-09` `replaceOpenMealSlotFromLibrary`; private locators | Owns `/recipes` and the add-to-menu dialog (one page, dialog is part of it). Locators inline |
| `UiFixture` | `tests/components/UiFixture.ts` | Extend | register `recipes` | |
| `DataFactory` | `tests/data/DataFactory.ts` | Extend | `currentIsoWeekInMadrid()` calling `futureIsoWeek(0, <Madrid date as UTC midnight>)` | The app decides "current week" and "today" in Europe/Madrid (`lib/api/open-slots.ts`); `futureIsoWeek(0)` uses the runner's UTC date and disagrees near midnight |
| `tests/utils/restoreProfile.ts` | New util | New | `withDietaryPreferencesRestored(profiles, action)` | Snapshot, run, restore in `finally`, restore failure never masks the original failure (annotation `restore-failed`, same as `UI-TC-14`). Third use of the pattern (`UI-TC-14`, `TC-04`, `UI-TC-09`), so a helper is justified. `UI-TC-14` is not refactored |
| Types | `api/schemas/recipes.types.ts` | Extend | `Recipe.clasificacion?: { tipo_plato?: string }` | Needed to pick a recipe of the slot type. Field existence in the API payload unverified |
| Types | `api/schemas/profiles.types.ts` | Extend | `UserProfile.ingredientes_odiados?: string[]` | Needed for the TC-04 baseline guard. Column exists (seed writes it); API exposure unverified |
| Steps | none | none | | No chain repeated in 3 files |

No ATC calls an ATC. Locators stay inline until a second use.

## 5. Files

| Test file | Project | ATC | Persona |
|---|---|---|---|
| `tests/integration/menu-safety/filterBySeveralAllergens.test.ts` | `integration` | `TC-04` (6 tests) | `familia` |
| `tests/e2e/menu-safety/replaceMealSlotFromLibrary.test.ts` | `e2e` | `UI-TC-09` | `familia` |

Order with `workers: 1`: `integration` runs before `e2e` as listed in `playwright.config.ts`; each test restores its own state, so order does not matter for correctness.

## 6. Data and cleanup strategy

### 6.1 TC-04 (no generation)

| Step | Action | Layer |
|---|---|---|
| 1 | `beforeEach`: `api.profiles.getOwnProfile()`; `api.mealPlans.expectNoMenusFromWeek(currentIsoWeekInMadrid())`: fail with "profile writes retire open menu slots: delete these menus first" if any menu of this week or later exists | step |
| 2 | `withDietaryPreferencesRestored`: snapshot `toDietaryPreferences(profile)` | util |
| 3 | `setDietaryPreferences({ alergenos: row, all 7 diet flags false })`; readback equals the row (positive control) | step |
| 4 | Baseline guard: stored `ingredientes_odiados` is empty (the filter also drops disliked ingredients, which would break the count identity) | test |
| 5 | ATC `TC-04` with `{ userId, allergens: row }` | ATC |
| 6 | `finally`: restore snapshot, readback equals snapshot | util |

Why a profile write and not an explicit RPC argument: the RPC has no such argument (`get_filtered_recipes(p_user_id, p_recipe_id)`, lines 31 and 44 of `20260908180000_recipes_activo_soft_delete.sql`); `p_user_id` must equal `auth.uid()`. Menu generation reads the same stored profile.

Interaction with other tests: `TC-08` mutates only the household of `familia` and restores it; `UI-TC-11` and `UI-TC-09` use `familia` too. No test runs in parallel.

### 6.2 UI-TC-09 (1 generation)

| Step | Action | Layer |
|---|---|---|
| 1 | `expectNoMenusFromWeek(currentWeek)`: a current-week menu left by a manual session is a failed precondition, never deleted blindly | step |
| 2 | `withDietaryPreferencesRestored`: set `alergenos = ['huevo']`, diets false (no menu exists yet, so the retire trigger does nothing) | util |
| 3 | Setup through the API: `generateMenuForWeek(currentWeek)` wrapped in `runUnlessRateLimited`; `readMenuForWeek` gives the 21 stored rows `before` | step |
| 4 | `listSafeRecipesOfType(userId, 'comida')` through the RPC; pick the first by name whose name is unique in the list and whose id is not in `before` | step |
| 5 | UI: form login (`PROJ-111`), `ui.recipes.replaceOpenMealSlotFromLibrary({ name })` | ATC |
| 6 | Test-level readback `after` and the diff assertions (section 7 of `atc/UI-TC-09.md`) | test |
| 7 | `finally` (in this order): `deleteMenuForWeek(currentWeek)` and assert no leftovers; then profile restore | steps |

Re-runnable: yes, provided the week has no menu at start and `familia` has quota (3 of 5 after this plan). A rerun inside the same UTC hour spends 1 more (4 of 5).

## 7. Quota (generations per user per UTC hour, limit 5)

| Persona | Spent today (API + UI) | Added by this plan | Total |
|---|---|---|---|
| `alergia` | 4 + 1 = 5 | 0 | 5 |
| `vegano` | 2 + 1 + 1 (`CHK-A2`) = 4 | 0 | 4 |
| `familia` | 1 (`CHK-A2`) + 1 = 2 | 1 (`UI-TC-09`) | 3 |

`TC-04` spends 0: no generation is involved. `assign_recipe_to_slot` has its own limit of 60 per hour (`20261009120000_assign_recipe_to_slot.sql` line 27): 1 call.

## 8. Risks and unverified items (confirm in Phase 2 against the live stack)

| # | Risk | Mitigation or check |
|---|---|---|
| R1 | Catalogue of about 1000 rows against the PostgREST row cap (default 1000): a truncated RPC result could hide an offender and make `TC-04` pass vacuously | First live check: count with `Prefer: count=exact` and read `Content-Range`. The ATC filters server side (`alergenos=cs.["<slug>"]` on the RPC result and `or=(...)` on the catalogue) and compares counts from `Content-Range`, so no full list is needed. Whether PostgREST accepts query filters on a POST `rpc` call here is unverified |
| R2 | Catalogue may hold no active recipe tagged `frutos_de_cascara`, `pescado` or `soja` (known gap: `altramuces`, F-06) | The ATC fails loudly with the allergen name. If a tag has no recipe, the owner drops that row |
| R3 | `familia` locally may hold disliked ingredients or other state from manual onboarding | Baseline guard (section 6.1 step 4); the CI seed has none |
| R4 | Current-week menu: past days are empty (U-03), so the readback has null recipes | All 21 rows are compared by id; null stays null |
| R5 | A row of the dialog may not be the slot the test expects (earliest open `comida` of the week) | The test does not predict it: it reads the `Ahora:` text of the first option and matches it to the one changed row |
| R6 | `/recipes?q=<name>` may return several cards or none (library is the filtered catalogue, 30 per page) | Search by full name; the card is selected by exact text; zero cards fails the precondition with the name |
| R7 | Madrid versus runner clock near midnight | `currentIsoWeekInMadrid()` |
| R8 | The profile write trigger retires slots (section 6.1) | `expectNoMenusFromWeek` precondition; never delete a menu the test did not create |
| R9 | AC-4 meaning (PO-1) | Owner answer; `UI-TC-09` covers add-to-menu only |

## 9. Acceptance criteria

- [ ] 2 new ids (`TC-04`, `UI-TC-09`), `bun run kata:manifest:check` clean, no duplicate
- [ ] `TC-04`: 6 rows, each with a vacuity guard; profile of `familia` equals its pre-run value after each row, also when a row fails
- [ ] `UI-TC-09`: at most 1 generation, menu deleted by plan id with leftovers asserted empty, profile restored
- [ ] Every assertion can fail: expected values are literals (`huevo`, row sets, 1 changed slot, 21 rows); the oracle for the union is a separate catalogue read
- [ ] `bun run test:integration` and `bun run test:e2e` restricted to `tests/{integration,e2e}/menu-safety`, `types:check`, `lint:check` green on local, no retries
- [ ] No code comments (Critical Rule #18), import aliases only, no `waitForTimeout`, `networkidle`, `waitForSelector`

## 10. Open questions for the owner

| # | Question | Needed from |
|---|---|---|
| PO-1 | Which flow is AC-4's "swap", and is "regenerar solo ese slot" (FAQ) a feature the product owes? | Product owner |
| Q2 | OK to run `UI-TC-09` as `familia` with `huevo` written for the run (quota) instead of `alergia`? | Owner |
| Q3 | Keep the pairwise rows R4 to R6 of `TC-04`, or only the three TC rows? | Owner |
| Q4 | Add the negative sibling `TC-09-2` (assign an egg recipe through the RPC, expect refusal, slot unchanged)? It costs no extra generation if it shares the `UI-TC-09` menu, but then it cannot be a separate test without a second generation | Owner |
| Q5 | TC-10 (adding an allergen after generation) is documented as a finding (F-03), but migration `20261111100000` records an owner decision of 2026-11-11 that slots are retired automatically. Re-evaluate TC-10 expected result | Product owner |
