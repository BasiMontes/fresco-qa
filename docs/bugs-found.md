# Bugs found: Allergy-safe weekly menu

Defects found while testing the Fresco allergy-safe weekly menu. Sources are the session reports in `docs/session-reports/` and the cases in `docs/test-cases.md`.

**The product owner decided on 2026-11-23; each entry records the decision in its status.** BUG-04 is not a defect; BUG-01, BUG-02 and BUG-10 are confirmed; BUG-03 and BUG-05 are filed at the owner's request; BUG-06 to BUG-09 come from Jira and are not confirmed. No Story or specification exists, so the acceptance criteria (AC) were derived by QA in `docs/feature-test-plan.md`. Six defects were filed in the QAFRESCO Jira project (QAFRESCO-2 to QAFRESCO-7, type "Error", under the epic QAFRESCO-1, created on 2026-11-19, all with status "Tareas por hacer" and priority Medium). They map to this document as follows: QAFRESCO-2 is BUG-02; QAFRESCO-5 is related to BUG-04 but not identical; QAFRESCO-3, 4, 6 and 7 are BUG-06 to BUG-09. BUG-01, BUG-03 and BUG-05 were filed on 2026-11-23 as QAFRESCO-29, QAFRESCO-30 and QAFRESCO-31, and a new defect, BUG-10, as QAFRESCO-32. BUG-01 to BUG-05 were observed in one run on a local copy of the product (staging cannot be driven past the captcha, see `docs/session-reports/ui-session.md` section 1), so none has been reproduced a second time. BUG-06 to BUG-09 are transcribed from the Jira descriptions and carry the evidence listed in each entry.

Severity scale: Major (wrong behaviour on health or money data), Minor (wrong but low impact), Question (behaviour that may be intended). Priority: P1 fix before release, P2 should fix, P3 nice to fix.

## BUG-01 Vegan diet silently stores allergens the user did not choose

| Field | Value |
|---|---|
| Severity / Priority | Medium / P2 (after the PO decision; it was Major as a candidate).  Health data is stored without the user choosing it, and the AC-8 consent only covers what the user declares |
| Area | UI, DB |
| Linked case / AC | TC-16 / AC-1, AC-8 |
| Jira key | QAFRESCO-29 (filed 2026-11-23) |
| Status | Confirmed by the PO for `sulfitos` on 2026-11-23. `huevo` and `pescado` contradict a vegan diet and are accepted; `sulfitos` does not |
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

PO decision (2026-11-23): an implied allergen is fine when it contradicts the diet; otherwise it must be reviewed and corrected. Cause found in the product code: `DIETA_IMPLIED_ALERGENOS` in `lib/constants/dietary-options.ts` (FRESCO-275) implies `huevo`, `pescado` and `sulfitos` for vegano and `pescado` and `sulfitos` for vegetariano, on the grounds that no recipe of the catalogue carries both. In the local catalogue 2 active vegan recipes carry `sulfitos` (and 3 vegetarian), so the rule no longer holds; with `huevo` and with `pescado` there are 0 vegan recipes.

## BUG-02 Menu over the weekly budget shows no warning

| Field | Value |
|---|---|
| Severity / Priority | Major / P2. The onboarding promises a warning for a budget the menu does not respect |
| Area | UI, DB |
| Linked case / AC | TC-17 / AC-11 |
| Jira key | QAFRESCO-2 (priority Medium). Same defect, different run: the Jira run shows 97.32 EUR against a 90 EUR budget and empty warnings, in the account `qa-alergia` of `fresco-pre`; this entry shows 94.95 EUR against 35 EUR on the local stack |
| Status | Confirmed by the PO on 2026-11-23: the warning must be added in the product (fix in `fresco-app`) |
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
| Jira key | QAFRESCO-30 (filed 2026-11-23) |
| Status | Filed at the PO's request on 2026-11-23; the product's images are being redone |
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
| Jira key | None for the empty slots. Related to QAFRESCO-5 (priority Medium): the same mid-week generation, seen as past days labelled "Excluida por ti". The two may share a cause but are not claimed to be identical |
| Status | **Not a defect** (PO, 2026-11-23): a menu created mid-week leaves the past days empty by design, because weeks start on Monday. QAFRESCO-5 stays open for the label only |
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
| Jira key | QAFRESCO-31 (filed 2026-11-23) |
| Status | Filed at the PO's request on 2026-11-23; the PO needs more information to decide |
| Evidence | `docs/session-reports/api-session.md` sections 2, 3 and 5 |
| Automated coverage | None, by decision: it is a PO question and not a rule (`.context/PBI/epics/EPIC-DOJO-allergy-safe-menu/test-specs/api-menu-safety/spec.md`) |

Preconditions: the local stack running and the public API key; no session.

Steps:
1. Send `GET /rest/v1/recipes` with the public key and no user token.
2. Repeat with the filter `activo=false`.

Expected: unknown. Inactive recipes are withdrawn or unpublished, so the PO must say whether they should be public.

Actual: both calls return 200 and the second returns an inactive recipe.

## BUG-06 Active catalogue holds recipes with a repeated name

| Field | Value |
|---|---|
| Jira key / title | QAFRESCO-3 / "El catálogo activo tiene recetas con el nombre repetido" |
| Severity / Priority | Minor (Jira severity "Baja") / Jira priority Medium |
| Area | UI, DB |
| Linked case / AC | none in `docs/test-cases.md` |
| Status | Reported in Jira as QAFRESCO-3 |
| Evidence | Evidence only in the Jira issue (read-only query counts and example names). No session report or screenshot in this repository covers it |
| Automated coverage | None |

Steps (from the Jira description):
1. With any account, open `/recetas`.
2. Search for "Crema de calabacín".

Expected: one recipe per name.

Actual: two cards with the same name. The Jira query reports 14 names with more than one active recipe (28 rows), for example "Cocido madrileño", "Fabada asturiana" and "Pad thai de gambas". Repeated names in total are 94, almost all inactive rows.

Open point (from Jira): whether the pairs are intended variants or a load duplicate; the ingredients of each pair were not compared.

## BUG-07 Onboarding summary does not reflect the meals chosen per day

| Field | Value |
|---|---|
| Jira key / title | QAFRESCO-4 / "El resumen del onboarding no refleja la selección de comidas por día" |
| Severity / Priority | Minor (Jira severity "Baja") / Jira priority Medium |
| Area | UI, DB |
| Linked case / AC | none in `docs/test-cases.md` |
| Status | Reported in Jira as QAFRESCO-4 |
| Evidence | Evidence only in the Jira issue (summary text and `user_profiles.planning_selection`). No session report or screenshot in this repository covers it |
| Automated coverage | None |

Steps: the Jira description gives evidence but no numbered steps. Account `qa-vegano` on `fresco-pre`, plan Free.

Expected: the summary shows exactly the chosen meals, slot by slot.

Actual: the summary lists the days Lun, Mar, Mié, Jue, Vie and Dom with the meals "Comida, Cena", while the stored `planning_selection` has Friday with lunch only, Sunday with dinner only and Saturday empty. The calendar shows Friday without dinner and Sunday without lunch.

Open point (from Jira): whether the person chose that split on purpose. If so, the defect is only that the summary does not reflect it; if not, the defect is in the saving.

## BUG-08 Vegan recipes are tagged only "Vegetariano" for a vegan profile

| Field | Value |
|---|---|
| Jira key / title | QAFRESCO-6 / "Las recetas veganas se etiquetan solo como Vegetariano para un perfil vegano" |
| Severity / Priority | Minor (Jira severity "Baja"; a clarity observation, not a filter failure) / Jira priority Medium |
| Area | UI |
| Linked case / AC | TC-03 |
| Status | Reported in Jira as QAFRESCO-6 |
| Evidence | `docs/session-reports/ui-session.md` section 5 (U-06) and [Menu, persona B](session-reports/screenshots/ui/05-local-vegano-menu.png); the Jira issue adds the stored diet flags |
| Automated coverage | None |

Preconditions: an account with the diets vegano and sin lactosa.

Steps (from the Jira description):
1. Open `/recetas`.
2. Read the tags of "Tinga de setas" or "Arroz con verduras".

Expected: the tag shows the most specific diet ("Vegano") or both.

Actual: only "Vegetariano" is shown, while the stored recipe has `vegano: true` and `vegetariano: true`. In the UI session every recipe card shows a single diet tag and the menu of the vegan persona reads "Vegetariano".

Open point (from Jira): whether the interface picks the more general tag on purpose.

## BUG-09 Reconcile cron may downgrade Pro plans granted without a subscription

| Field | Value |
|---|---|
| Jira key / title | QAFRESCO-7 / "El cron degrada a Free los Pro concedidos sin suscripción, contra lo que documenta grant-pro" |
| Severity / Priority | Medium per the Jira impact note (free Pro pilots would lose the plan nightly), unexecuted / Jira priority Medium |
| Area | Billing, scheduled job (backend) |
| Linked case / AC | none in `docs/test-cases.md` |
| Status | Reported in Jira as QAFRESCO-7 |
| Evidence | Evidence only in the Jira issue: a reading of the product code (`grant-pro` script, `lib/billing/reconcile.ts`, `app/api/cron/stripe-reconcile/route.ts`, migration `20260828174500`). That code is not in this repository and was not run |
| Automated coverage | None |

Steps: the Jira description gives none; the proposed check is to grant Pro to a test account, wait for the daily run at 04:17 UTC and read `user_profiles.plan`.

Expected: a Pro grant without a charge and with an end date survives until that date.

Actual (probable, not executed): the orphan sweep selects profiles with plan `pro` or `family` and no `stripe_subscription_id` and downgrades them to Free, with no exception for a future `plan_expires_at`, which contradicts the header of the product `grant-pro` script.

## BUG-10 No recipe carries the altramuces tag, so declaring lupin excludes nothing

| Field | Value |
|---|---|
| Severity / Priority | Medium / P2. Lupin is one of the 14 allergens that must be declared in the EU; the menu does not break, but the promise of exclusion cannot be checked for it |
| Area | DB, catalogue |
| Linked case / AC | TC-05 / AC-1 |
| Jira key | QAFRESCO-32 (filed 2026-11-23) |
| Status | Confirmed by the PO on 2026-11-23 ("we fix this") |
| Evidence | Read-only query on the local database: 0 active recipes with `altramuces` (34 with `sulfitos`); finding F-06 in `docs/session-reports/db-session.md` |
| Automated coverage | `UI-TC-05` checks that the allergen is saved and that the menu generates; it cannot prove the exclusion |

Steps:
1. In the preferences of a profile, select "Altramuces" and save.
2. Query the active recipes whose `alergenos` contain `altramuces`.

Expected: the recipes that contain lupin carry the tag, so the filter excludes them for whoever declares it; if none contains it, that is checked and documented.

Actual: the profile is saved and the menu generates, but 0 active recipes carry the tag, so the filter has nothing to exclude.

## Summary

| ID | Title | Severity | Priority | Area | Case | Jira | Evidence level | Automated |
|---|---|---|---|---|---|---|---|---|
| BUG-01 | Vegan and vegetarian diets store sulfitos unchosen | Medium | P2 | UI, DB | TC-16 | QAFRESCO-29 (confirmed) | One UI run, stored profile read in the DB | No |
| BUG-02 | No warning when the menu exceeds the budget | Major | P2 | UI, DB | TC-17 | QAFRESCO-2 (confirmed) | One UI run, screenshot, stored warnings read in the DB | No |
| BUG-03 | Photo shows egg on a recipe without egg | Minor | P3 | UI | TC-18 | QAFRESCO-30 (filed) | One UI run, screenshot | No |
| BUG-04 | Mid-week menu is partial (12 of 21): not a defect, by design | n/a | n/a | UI, API | TC-11 | Not a defect; QAFRESCO-5 is about the label | One UI run on all three personas, contrasted with the API | Partial (`UI-TC-11`, future week only) |
| BUG-05 | Inactive recipes readable anonymously | Question | P3 | API | none | QAFRESCO-31 (filed) | One API run (script, not a test) | No |
| BUG-06 | Repeated recipe names in the active catalogue | Minor | Jira Medium | UI, DB | none | QAFRESCO-3 | Jira issue only (read-only query) | No |
| BUG-07 | Onboarding summary ignores the per-day meal selection | Minor | Jira Medium | UI, DB | none | QAFRESCO-4 | Jira issue only | No |
| BUG-08 | Vegan recipes tagged only Vegetariano | Minor | Jira Medium | UI | TC-03 | QAFRESCO-6 | UI session U-06 with screenshot, plus Jira | No |
| BUG-09 | Cron may downgrade Pro grants without a subscription | Medium | Jira Medium | Billing, cron | none | QAFRESCO-7 | Jira issue only (code reading, not run) | No |
| BUG-10 | No recipe carries the altramuces tag | Medium | P2 | DB | TC-05 | QAFRESCO-32 (confirmed) | Read-only query, 0 recipes | No |

## Dropped after verification

- Free-text allergen ignored by the filter (TC-13): not a defect on this evidence. The onboarding offers no free-text field for allergens and states that the free-text diet field is not used to filter (U-08 in `docs/session-reports/ui-session.md`). The only exposure is a profile written outside the UI, observed in the data (F-01 in `docs/session-reports/db-session.md`).

## What was not verified

- The PO decided on 2026-11-23 on BUG-01 to BUG-05 and BUG-10. BUG-06 to BUG-09 come from Jira and are not confirmed with the PO. None was reproduced a second time.
- Staging: the captcha blocked every authenticated flow in the UI session, so its evidence comes from the local stack. The Jira issues QAFRESCO-2, 4, 5 and 6 cite staging accounts (`qa-alergia`, `qa-vegano`); how those sessions got past the captcha is not recorded in this repository.
- BUG-02 and QAFRESCO-2 report different figures (94.95 EUR against 35 EUR, and 97.32 EUR against 90 EUR); the match is on the behaviour, not on the run.
- BUG-04 and QAFRESCO-5: whether both come from the same mid-week generation rule was not checked.
- BUG-06, BUG-07 and BUG-09: evidence only in the Jira issues; no session report, screenshot or case in this repository covers them. BUG-09 is a reading of product code that is not in this repository and was not run.
- BUG-07: whether the stored per-day selection was chosen on purpose.
- BUG-01: whether the summary screen lists the stored allergens was not checked; the control that adds them is `DIETA_IMPLIED_ALERGENOS` in the product code.
- BUG-02: whether the estimate and the budget rule use different calculations.
- Older menus in the shared database that contain a declared allergen (F-02, F-03 in `docs/session-reports/db-session.md`) are unresolved and are not listed as defects.
- Shopping list, slot swap, profile edits after generation, account deletion and export were not exercised.
