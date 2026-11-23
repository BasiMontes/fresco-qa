# menu-safety-p1-gaps: automation batch spec

| Field | Value |
|---|---|
| Scope | Module-driven, Medium, slug `menu-safety-p1-gaps` |
| Surface | TC-04: API only (fixture `{ api }`, project `integration`). TC-09: UI with API setup and readback (fixture `{ test }`, project `e2e`) |
| Environment | `local` only: app `http://localhost:3000`, Supabase `http://127.0.0.1:54321`. Staging cannot be driven past the login (Turnstile, `docs/session-reports/ui-session.md` section 1) |
| Source of cases | `docs/test-cases.md` (TC-04, TC-09), `docs/feature-test-plan.md` (AC-1, AC-4) |
| Status | Phase 1 plan, awaiting owner approval. No code written |
| Stack at planning time | App and Supabase both unreachable (`curl` status 000 on `http://localhost:3000` and `http://127.0.0.1:54321/auth/v1/health`). Nothing below was verified live |

Facts come from the repository documents and from the product source, read-only (`~/fresco/fresco-app`). "Unverified" means not seen in a live run.

## TCs in scope

Bodies live in `docs/test-cases.md`; they are not restated here.

| TC | Title | ATC | Persona | Quota spend |
|---|---|---|---|---|
| TC-04 | Several allergens exclude the union of all of them | `TC-04` (parameterized, 6 rows) | `familia` (profile temporarily rewritten) | 0 |
| TC-09 | Swapping one slot changes only that slot and stays safe | `UI-TC-09` | `familia` with `huevo` declared for the run (deviation from "Persona A", see section 3) | 1 generation, `familia` 2 of 5 today, 3 of 5 after |

## 1. Why these two were never automated (inferred: `docs/automation-eval.md` section 2.1 records no reason)

| TC | Real blockers found |
|---|---|
| TC-04 | The filter takes no allergen argument. `get_filtered_recipes(p_user_id, p_recipe_id)` reads `user_profiles.alergenos` of the caller and raises `caller does not own profile` for any other id (`supabase/migrations/20260908180000_recipes_activo_soft_delete.sql` lines 31 to 60). The only way to test a combination is to write the profile and restore it. A profile write also runs the trigger `user_profiles_retire_conflicting_slots`, which turns the caller's open slots of this ISO week and later into `excluida` with `recipe_id` null, and restoring the profile does not bring them back (`20261111100000_retire_slots_that_conflict_with_the_profile.sql` lines 10 to 17 and 141 to 157). So the test is destructive to any menu the persona holds |
| TC-09 | (a) The product has no "regenerate one slot" feature, although the FAQ promises it (`components/landing/faq-data.ts` line 23: "regenerar solo ese slot"); no code path contains it (`rg` for regenera/reroll in `app`, `components`, `lib`, `supabase/functions` finds only copy). The two real flows are different from the TC wording, see section 2. (b) The only flow that puts a new recipe in one slot works on the current ISO week only (`lib/api/open-slots.ts` filters `semana_iso = getIsoWeek()` and `fecha >= today`), so a menu for the current week must exist, unlike the random future weeks the suite uses. (c) It needs a generation, and `alergia` is already at 5 of 5 |

## 2. Real flows behind "swap" (product source)

| Flow | UI entry | Persistence | Slots that change | Fits TC-09? |
|---|---|---|---|---|
| Add to menu ("Añadir al menú", replaces a slot) | `/recipes` card icon `recipe_card_add_to_menu_button`, dialog `add_to_menu_dialog` | RPC `assign_recipe_to_slot(p_slot_id, p_recipe_id)`: slot must be `pendiente` or `sustituida`, not in a past day, recipe must come out of `get_filtered_recipes` for the caller, same `tipo_plato` (`20261009120000_assign_recipe_to_slot.sql` lines 29 to 108) | exactly one | Yes: one slot changes, new recipe is checked by the profile filter. Chosen |
| Drag to reorder | Calendar handle `Arrastrar para reordenar` (`components/calendar/slot-drag-handle.tsx` line 26) | RPC `swap_meal_plan_slots` exchanges `recipe_id`, `estado`, `rating`, `sustitucion_ingrediente` of two slots of the same `tipo_plato` (`20261111150000_swap_carries_substitution.sql` lines 62 to 90) | exactly two, no new recipe enters the menu | No: "only that slot changes" is false by design and the allergen question cannot arise. Deferred |
| Ingredient substitution | `Sustituir` in a recipe opened from a slot (`components/recipes/ingredient-list.tsx` line 115) | `confirm_ingredient_substitution` | zero recipes change | No. Out of scope |

Product-owner question PO-1: resolved by the PO (option A). AC-4 means the "Añadir al menú" flow, which `UI-TC-09` covers in full. The FAQ sentence about regenerating one slot is a promise the product does not keep and is registered as BUG-11 (QAFRESCO-33).

## 3. Deviations from the TC text (need owner OK)

| TC text | Plan | Reason |
|---|---|---|
| TC-09 "Persona A" | `familia` with `huevo` written to its profile for the run, restored in `finally` | `alergia` already spends 4 API plus 1 UI generations (5 of 5); one more fails in CI. `familia` spends 2 |
| TC-09 "swap one slot; note the 21 recipes" | Mid-week the current-week menu has fewer than 21 filled slots (U-03, `docs/session-reports/ui-session.md`); the test compares all 21 stored rows, filled or not | Date-independent oracle |
| TC-04 "throwaway profile change on a test account" | `familia`, rewritten and restored per row | Keeps `alergia` and `vegano` untouched; `familia` has no restriction at baseline in the CI seed (`scripts/ci/seed-personas.ts`, `BASE_PROFILE`) |

## 4. Product facts used (source file and line; not verified live)

| Fact | Source |
|---|---|
| Filter rules: allergens compared lowercase both sides, 7 diet flags, disliked ingredients, `activo` | `20260908180000_recipes_activo_soft_delete.sql` lines 46 to 73 |
| Allergen vocabulary of a profile: `altramuces, apio, cacahuetes, crustaceos, frutos_de_cascara, gluten, huevo, lactosa, mostaza, moluscos, pescado, sesamo, soja, sulfitos` (CHECK `user_profiles_alergenos_vocab`) | `20261019120000_revoke_surplus_grants_and_validate_inputs.sql` lines 36 to 38 |
| `authenticated` can select and update `user_profiles`; `anon` and `authenticated` can select `recipes` | `20260729120000_grant_authenticated_table_privileges.sql` line 15; `20260725110000_baseline_recipes_catalog.sql` line 120 |
| `/recipes` is driven by `?q=`; catalogue is the caller's filtered set; page size 30 | `app/(app)/recipes/page.tsx` lines 15 to 26 and 51; `lib/recipes/recipe-filters.ts` line 38 |
| Search box `recipe_search_input`; grid `recipe_library_grid`; each card is a link to `/recipes/<id>` wrapping a card | `components/recipes/recipe-library.tsx` lines 201 and 351 to 363 |
| Add button on a card: `recipe_card_add_to_menu_button`, `aria-label` "Añadir al menú"; shown only when the recipe has a `tipo_plato` of desayuno, comida or cena | `components/recipe/recipe-card.tsx` lines 85 to 92; `recipe-library.tsx` lines 84 to 88 |
| Dialog test ids: `add_to_menu_dialog`, `add_to_menu_loading`, `add_to_menu_empty_state`, `add_to_menu_slot_option` (radio), `add_to_menu_error`, `add_to_menu_success`, `add_to_menu_confirm_button`; each option label shows `Ahora: <current recipe name>` | `components/recipes/add-to-menu-dialog.tsx` lines 116, 133, 146, 170, 184, 188, 226 and 172 to 176 |
| Open slots offered: current ISO week, same `tipo_plato`, `pendiente` or `sustituida`, date today or later in Madrid, sorted by date | `lib/api/open-slots.ts` (function `listOpenSlots`) |
| Calendar slot `calendar_slot_<dia>_<tipo>`, name in the `h2` | `components/calendar/slot-cell.tsx` line 81 |
| `assign_recipe_to_slot` rate limit 60 per hour; errors: slot not found, not open, past day, recipe not available for this profile, tipo_plato mismatch | `20261009120000_assign_recipe_to_slot.sql` lines 27 to 90 |

## Test-Design Checklist

```
[x] P1   Beyond "AC passes": TC-04 asserts both directions of the union (no tagged recipe leaks AND nothing untagged is
         dropped, by a count identity against an independent catalogue read); TC-09 asserts the DB diff of all 21 rows, not
         what the dialog says
[x] P2   AC as floor, with positive controls that fail loudly: every declared allergen has at least one tagged active
         recipe (else the row is vacuous); stored profile equals the row after the PATCH; the chosen recipe is not already
         in the menu (else "changed" is unobservable); no open slot is a failure of the precondition, not a pass
[x] P3   Concrete exploration: named persona, named allergen slugs, named flow (Biblioteca card, add to menu), literal
         allergen `huevo` for the safety assertion
[x] P4   Single-ATC justification: UI-TC-09 is one flow with one outcome. TC-04 is ONE parameterized ATC (all rows have the
         same preconditions, action and oracle; only the declared set differs)
[x] P5   Anomalies the TC is silent on: the FAQ promise without a feature (PO-1); profile writes retire menu slots
         irreversibly (precondition: no menus this week or later); mid-week current-week menus have empty past slots
[x] EP   Partitions of "declared set": single allergen, pair, full set of 4 (TC rows) plus each of the other three alone
         (pairwise rows). Invalid partitions (vocabulary violation, other user's profile) are API TC-15 and a possible
         later CHK; not here
[x] BVA  N/A: no range. The only quantity is the size of the declared set (1, 2, 4), covered by the rows
[x] BVA-D N/A: no rounding or truncation
[x] ST   TC-09: slot state `pendiente` is the only start state exercised. `sustituida`, `cocinada`, `descartada`, `excluida`
         and past-day slots (all rejected by the RPC) are deferred, see RISK
[x] DT   Built, see below: 4 allergen conditions (huevo, pescado, frutos_de_cascara, soja), outcome = excluded set
[x] PW   Applied and logged: 4 binary factors, all-pairs reduced to 5 rows (the full set plus each factor alone), plus the
         TC row {huevo, pescado} which is the only owner-written pair. 6 rows instead of 16
[x] PARAM TC-04: ONE parameterized ATC, rows in the test file, one `test()` per row. UI-TC-09: no variants
[x] RISK P1 both. Dropped or deferred with reason: drag-to-reorder flow (two slots change, no new recipe), negative probe
         "assign an egg recipe through the RPC and expect `recipe is not available for this profile`" (needs the menu of
         UI-TC-09 and an unsafe recipe id; candidate sibling ATC `TC-09-2`, API, owner decides), allergen diet flags
         (AC-2), staging (captcha)
[x] OBS  Reachable on local: personas, catalogue, filter RPC, profile PATCH (precedent: UI-TC-14 and TC-08). Unreachable or
         unverified now: the stack is down; catalogue coverage of pescado, frutos_de_cascara and soja; the 1000-row API cap
         against a catalogue of about 1000 rows; the real selector text of the card
[x] SEED The derived values (filtered set, stored slots) come from the product paths (the RPC, the generator, the dialog),
         never from fixtures written by the test
```

### Decision table (TC-04)

Conditions: H = huevo declared, P = pescado, F = frutos_de_cascara, S = soja. Action: the filtered set must contain no recipe tagged with any declared allergen and must keep every active untagged recipe.

| Row | H | P | F | S | Expected excluded | Source |
|---|---|---|---|---|---|---|
| R1 | Y | N | N | N | recipes tagged huevo | TC-04 row 1 |
| R2 | Y | Y | N | N | tagged huevo or pescado | TC-04 row 2 |
| R3 | Y | Y | Y | Y | tagged with any of the four | TC-04 row 3 |
| R4 | N | Y | N | N | tagged pescado | pairwise |
| R5 | N | N | Y | N | tagged frutos_de_cascara | pairwise |
| R6 | N | N | N | Y | tagged soja | pairwise |

Why R4 to R6: R1 to R3 always contain huevo, so a defect that mishandles one of the other three allergens in isolation (tag spelling, casing) would pass every owner row. If the owner wants only the TC rows, drop R4 to R6; the ATC is unchanged.

## Known limits

- The oracle for TC-04 is the catalogue as read through `recipes` (`activo = true`, `alergenos` contains slug), a different code path from the RPC. It is not a hardcoded recipe list because the catalogue changes; the declared sets are literals.
- UI-TC-09 does not prove that the library hides unsafe recipes (the comment at `app/(app)/recipes/page.tsx` line 18 says it does; unverified). The database guard is what the assertion on the stored recipe checks.
- Quota: a 429 on the setup generation is NOT RUN locally and a failure in CI (`runUnlessRateLimited`).
- TC ids are not tracker keys (owner decision: no Jira, `tms.autoSync` stays false).
