# Test Automation Plan: api-menu-safety

> Scope: module-driven, type integration (API only). Created 2026-11-19. Status: implemented; reviewed (round D2b).
> Facts come only from `docs/test-cases.md` and `docs/session-reports/api-session.md`. (inferred) marks anything else.

## 1. Waived gates (owner decision, to be recorded in `docs/automation-eval.md`)

| Gate | Decision |
|---|---|
| Jira TC source gate, signed ROI verdicts | Waived: `docs/test-cases.md` is the TC source |
| Three business context maps | Waived for this scope |
| `/test-framework-adaptation` | Waived; project-owned files are adapted by hand in Phase 2 |
| Jira transitions, labels, TMS sync | Not done (`tms.autoSync` stays `false`) |
| Everything else (KATA layers, ATC rules, lint, types, review) | Fully applied |

## 2. Architecture decisions

### 2.1 ATC identity

| Decision | Value | Rationale |
|---|---|---|
| Id source | The TC key: `@atc('TC-15')` | Owner decision; traceable to `docs/test-cases.md` |
| Collision check | `kata-manifest.json` holds only `PROJ-101/102/111/112/121/122/131/132`; no `TC-*` or `CHK-*` id exists | No collision |
| One method per id | `scripts/kata-manifest.ts` `findDuplicateAtcIds` fails `kata:manifest:check` (the commit gate) when one id decorates 2 methods | A TC that splits by outcome gets suffixed ids: `TC-08-1`, `TC-08-2` |
| Ids without a TC | `CHK-<report id>` (for example `CHK-A2`) | Traceable to the API session report; provisional until the owner adds TCs |
| Format risk | `TC-15` does not match a Jira key under project `QAFRESCO`; the manifest regex accepts any string | Harmless while `tms.autoSync=false`; revisit if Jira sync is ever enabled |
| Sample components | Leave in place during this scope | Not colliding. Proposal for a later `/framework-development` chore: remove `ExampleApi`, `ExamplePage`, `LoginPage`, `ExampleSteps`, `tests/e2e/**`, `tests/integration/module-example/**` |
| `AuthApi` and `tests/integration/auth/user-session.test.ts` | Do not reuse the two ATCs; the sample test also runs under `--project=integration` | (inferred) `authenticateSuccessfully` asserts `token_type` equals `Bearer` and `meBody.user`; Supabase Auth likely returns lowercase `bearer` and a top-level user. Verify in Phase 2; run with a path filter until the samples are removed |

### 2.2 Components (Layer 3)

| Component | File | Why | Fixture key |
|---|---|---|---|
| `RecipesApi` | `tests/components/api/RecipesApi.ts` | RPC `get_filtered_recipes`, `GET /rest/v1/recipes` | `api.recipes` |
| `MealPlansApi` | `tests/components/api/MealPlansApi.ts` | `generate-meal-plan`, `meal_plans`, `meal_plan_recipes` | `api.mealPlans` |
| `ProfilesApi` | `tests/components/api/ProfilesApi.ts` | `user_profiles` reads and updates | `api.profiles` |
| `AccessControlApi` (new, not in the owner's suggestion) | `tests/components/api/AccessControlApi.ts` | Checks parameterized across tables and surfaces (anonymous, tampered, cross-user reads) belong to no single resource; one component keeps them from leaking into three | `api.access` |
| `AuthApi` (existing) | extended | One new `@step` helper `signInWithPassword`; no `@atc` | `api.auth` |

`ApiFixture` registers the four new components and extends its `setAuthToken` and `clearAuthToken` overrides to propagate to them.

### 2.3 Multi-role authentication (minimal, no layer collapse)

| Step | Change | Layer |
|---|---|---|
| 1 | `config/variables.ts`: `auth.roles = ['alergia','vegano','familia']`; getter `roleCredentials(role)` reads `<ENV>_<ROLE>_EMAIL` and `<ENV>_<ROLE>_PASSWORD` by name and throws a named error when empty; `supabaseAnonKey` read from `<ENV>_SUPABASE_ANON_KEY` | Config (project-owned) |
| 2 | `playwright.config.ts`, project `integration`: `use.extraHTTPHeaders` = existing headers plus `apikey: config.supabaseAnonKey` (spread, because a project-level value replaces the root one) | Config |
| 3 | `tests/setup/api-auth.setup.ts`: loop over `config.auth.roles`; `api.auth.signInWithPassword(credentials)`; write `.auth/roles/<role>.json` = `ApiState` plus `role` and `userId` (`.auth/` is gitignored). The default-user sign-in is dropped because `LOCAL_USER_*` is not part of this project (unverified: `.env` not read) | Setup |
| 4 | `TestFixture`: option fixture `role` (default undefined). `api` fixture loads the state through `@utils/roleState` `loadRoleState(role)` (returns null on failure) and throws a named error if a role is set but its state is missing. Tests declare `test.use({ role: 'alergia' })` | Fixture (Layer 4) |
| 5 | `ApiFixture.asRole(role)` returns a sibling `ApiFixture` on the same `request`, token from that role's state. Used only to read the victim in isolation tests | Fixture (Layer 4) |

`bun run api:login --role <r>` is untouched: it keeps writing `.auth/tokens.env` and `api-state.json` for agentic and curl use with the same variable names. Tests never read `tokens.env`. `ApiBase`, `TestContext` and `ApiState` stay as they are; the role state is a new type `RoleState extends ApiState` in `tests/data/types.ts`.

Alternatives rejected: one Playwright project per role (3 sign-ins and 3 projects for what is a per-describe option); reading `tokens.env` (couples tests to an agent tool and parses a secrets file).

### 2.4 Helper versus ATC (rule 7)

| Call | Kind | Reason |
|---|---|---|
| Generate menu (POST), update household (PATCH), update other's profile (PATCH) | ATC | State change or its denial is the outcome under test |
| `get_filtered_recipes` for another user, as owner, `GET recipes` anonymous, reads of other users' rows, anonymous and tampered calls | ATC | The response is the business outcome (data, 400, 401, empty) |
| `getOwnProfile`, `getRecipesByIds`, `listOwnMealPlans`, `getMealPlanRecipes` | Helper (`@step`) | Prepare or confirm data; no business outcome of their own |
| `deleteMealPlan`, `restoreHousehold` | Helper (`@step`, fixed status check) | Teardown of data the test created or changed; no TC; reading rule 7 strictly they change state, so this is flagged as Q5 |
| `signInWithPassword` | Helper (`@step`) | Setup only |

No ATC calls an ATC. The chain "generate, then generate again for the same week, then generate a second week" lives in the test body (3 ATC calls), not in a Steps module: it is used by one file only (Steps need 3+ ATCs repeated in 3+ files).

### 2.5 Types

`api/schemas/` types come from OpenAPI (`bun run api:sync`); the `openapi` MCP failed to connect in this session, so availability is unverified. Edge function bodies have no OpenAPI. Plan: hand-written facade types `api/schemas/menu.types.ts`, `recipes.types.ts`, `profiles.types.ts`, imported through `@schemas/`. Column names (Q3) are confirmed in Phase 2 from the PostgREST schema root or `api:sync`.

## 3. ATC registry

New ATCs (21). Reuse: none.

| ATC id | Component.method | Type | Fixture / role | Source | Technique | Data |
|---|---|---|---|---|---|---|
| TC-01 | MealPlansApi.generateMenuForEggAllergicProfile(week) | Mutation | api / alergia | TC-01 | EP valid; 21 slots, no `huevo` | findFreeWeek, cleanup by plan id |
| TC-02 | MealPlansApi.generateMenuOnAnotherWeekStaysEggFree(week) | Mutation | api / alergia | TC-02 | EP valid on a second week; no `huevo`, no `Ensalada cesar` (F-02) | findFreeWeek, cleanup by plan id |
| TC-03 | MealPlansApi.generateMenuForVeganLactoseFreeProfile({ week, allergens }) | Mutation | api / vegano | TC-03 | EP valid; allergens from the stored profile | findFreeWeek, Discover profile, cleanup |
| CHK-D1 | MealPlansApi.generateMenuWithMissingFields(payload) | Negative | api / familia | D1 | EP invalid: missing field, one test per row | Constants |
| CHK-D2 | MealPlansApi.generateMenuWithInvalidWeek(payload) | Negative | api / familia | D2 | EP invalid + BVA low (W99, W00), one test per row | Constants |
| CHK-D3 | MealPlansApi.generateMenuForExistingWeekReturnsConflict(week) | Negative | api / alergia | D3 | State: week already has a menu; recipe id set unchanged | Reuses TC-01's week |
| TC-08-1 | ProfilesApi.updateHouseholdWithinLimits(household) | Mutation | api / familia | TC-08 | BVA + DT accepted rows | Modify own profile, restore |
| TC-08-2 | ProfilesApi.updateHouseholdOutsideLimits(household) | Negative | api / familia | TC-08 | BVA + DT rejected rows | Modify attempt, restore |
| CHK-A1 | ProfilesApi.listOwnProfilesReturnsOnlyOwnRow() | Verification | api / alergia | A1 | EP valid (control) | Discover |
| CHK-A5 | ProfilesApi.updateOtherUsersProfileChangesNothing(victimId, current) | Negative | api / alergia | A5, A6 | EP invalid: foreign owner | Discover victims |
| CHK-A2 | AccessControlApi.readOtherUsersRowsReturnsEmpty(args) | Negative | api / alergia | A2, A3, A4 | EP merge: 3 tables x 2 victims | Discover victims |
| CHK-U1-1 | AccessControlApi.readPrivateTableWithoutSessionIsDenied(table) | Negative | api / none | anonymous | EP invalid: 4 tables | Constants |
| CHK-U1-2 | AccessControlApi.callFilterRpcWithoutSessionIsDenied() | Negative | api / none | anonymous | EP invalid: RPC | Constants |
| CHK-U1-3 | AccessControlApi.callEdgeFunctionWithoutSessionIsDenied(functionName) | Negative | api / none | anonymous | EP invalid: 2 edge functions | Constants |
| CHK-C1-1 | AccessControlApi.readPrivateTableWithTamperedTokenIsDenied() | Negative | api / alergia | C1 | EP invalid: bad signature, REST | Tampered token |
| CHK-C1-2 | AccessControlApi.callEdgeFunctionWithTamperedTokenIsDenied() | Negative | api / alergia | C2 | EP invalid: bad signature, edge | Tampered token |
| TC-15 | RecipesApi.getFilteredRecipesForAnotherUserRejected(targetUserId) | Negative | api / alergia | TC-15, B1 | EP invalid: foreign owner | Discover victim id |
| CHK-B2-1 | RecipesApi.getFilteredRecipesExcludeDeclaredAllergens(args) | Verification | api / alergia, vegano | B2 | EP valid; allergens from the stored profile | Discover |
| CHK-B2-2 | RecipesApi.getFilteredRecipesMatchDeclaredDiet(args) | Verification | api / vegano | B3 | EP valid; diet flags from the stored profile | Discover |
| CHK-U4 | RecipesApi.listCatalogWithoutSession() | Verification | api / none | anonymous catalogue | EP valid, control for U1 and C1 | Discover |

`CHK-U1-1` targets: `user_profiles`, `meal_plans`, `meal_plan_recipes`, `user_consents`; `CHK-U1-2`: `get_filtered_recipes`; `CHK-U1-3`: `generate-meal-plan` and `delete-account`. `CHK-C1-1`: REST `user_profiles`; `CHK-C1-2`: edge `generate-meal-plan`. `delete-account` is never called with a valid or tampered token.

Fixed assertions live inside each ATC (status, body shape, safety property); test-level assertions are only cross-ATC outcomes (victim snapshot before and after for A6, the same week reused for D3, cleanup confirmed). Expected values are literals from the documents, never recomputed from the response. Messages are asserted by loose pattern (`/does not own profile/i`, `/Faltan campos/`, `/no son v/i`) and status is always exact.

Why TC-01 and TC-02 are two ATCs: by the TC-identity rule they share precondition and action, so EP says one parameterized ATC. They stay separate only because the owner requires the TC key as the id and one id cannot sit on two methods. They share undecorated private helpers (`requestMenu`, `readMenu`, `generateAndRead`) so no code is duplicated; TC-02 is distinct because it also asserts no `Ensalada cesar` (F-02). Alternative if the owner prefers EP purity: one ATC `TC-01` called twice, and TC-02 recorded as "covered by `TC-01` rows".

## 4. Test data classification

| Datum | Class | Source | Placement | Cleanup |
|---|---|---|---|---|
| Role credentials, anon key | Config (not data) | `.env` by variable name, read in `config/variables.ts` | setup | none |
| Role token and `userId` | Discover | Sign-in response (inferred: GoTrue returns `user.id`; fallback `GET /auth/v1/user`) | `api-setup` | `.auth` is ignored and rewritten each run |
| Persona profile (allergen, diets, household) | Discover | `ProfilesApi.getOwnProfile` in the test; a failing `expect` naming the persona and the property when it does not match (never skip) | test | none |
| Victim user ids | Discover | `loadRoleState(<other role>)` | test | none |
| Future ISO week and Monday date for generation | Generate | `MealPlansApi.findFreeWeek()`: `DataFactory.randomFutureIsoWeek()` (offset 2 to 40), re-drawn while `listOwnMealPlans` shows the week; the week is in every assertion message | test | none |
| Generated menu | Generate (by the product) | `generate-meal-plan` | test | The request helper records the plan ids it created (list before and after); `cleanupMenus(planIds)` in `afterEach` deletes best-effort, never throws and returns the ids it could not delete; the test asserts that list is empty |
| Household values | Modify | Own `familia` profile; snapshot first | test | `restoreHousehold(snapshot)` in `finally` |
| Invalid payloads | Generate | Constants in `tests/data/` | test | none |
| Tampered token | Generate | `tamperToken(token)` utility from the role's own token | test | none |

Quota rules: generation allows 5 per hour per user, fixed window; 409 if the week has a menu.

| Rule | Behavior |
|---|---|
| Generation tests per run | 2 (`generateSafeMenu`: alergia chain, vegano flow). 3 successful generations: alergia 2 (TC-01, TC-02), vegano 1 (TC-03), plus 1 duplicate request (CHK-D3) |
| Per-user budget | alergia uses at most 3 of 5, vegano 1 of 5; the rest absorbs earlier use in the same hour |
| Validation tests | Run as `familia`, who generates nothing; 4 requests, one `test()` per row (D1: `{}` and missing `fecha_inicio`; D2: `2026-W99`, `2026-W00`); a wrongly created plan fails the test and is deleted. Whether a rejected request consumes quota is unknown, so a rejection can never starve the alergia or vegano budget |
| Dropped by quota | ISO week BVA upper rows (`W54`, malformed string) and valid boundary weeks (`W01`, `W53`): logged as a scope-driven drop |
| 429 handling | The component never skips: the shared request helper throws `RateLimitError` on 429 before any assertion. Tests wrap every generation call in `runUnlessRateLimited`: skip locally with a reason (NOT RUN), fail when `CI` is set. A 429 is never swallowed elsewhere |
| Reruns | At most one suite run per hour |

## 5. Test files

| # | File (`tests/integration/menu-safety/`) | Role (`test.use`) | Fixture | Tests (title prefix = id) | Notes |
|---|---|---|---|---|---|
| 1 | `enforceHouseholdLimits.test.ts` | familia | `{ api }` | `TC-08-1`, `TC-08-2` (rows via `for` over a data array) | Modifies `familia`; `afterEach` restore |
| 2 | `generateSafeMenu.test.ts` | alergia, vegano (two describes) | `{ api }` | `TC-01: ...` (one test: `test.step` TC-01, CHK-D3, TC-02, because CHK-D3 needs TC-01's week), `TC-03: ...` | The only 2 generation tests; `afterEach` cleans by plan id and asserts no leftover |
| 3 | `isolateUserData.test.ts` | alergia | `{ api }` | `CHK-A1`, `CHK-A2` (6 rows, preceded by the read-only own-rows helper), `CHK-A5` + victim snapshot compare via `api.asRole` (A6) | A5 sends the victim's current value back, so even a failing RLS changes nothing |
| 4 | `rejectInvalidMenuRequests.test.ts` | familia | `{ api }` | `CHK-D1` (2 tests), `CHK-D2` (2 tests), rows in data arrays | Quota-isolated; `afterEach` removes a wrongly created plan |
| 5 | `rejectUnauthorizedAccess.test.ts` | alergia | `{ api }` | `CHK-U4` first, then `CHK-U1-1/2/3` (token cleared), `CHK-C1-1/2` (token tampered) | Control before the denials |
| 6 | `restrictFilteredRecipes.test.ts` | alergia | `{ api }` | `CHK-B2-1` (alergia, vegano), `CHK-B2-2` (vegano), `TC-15` | `vegano` rows use `api.asRole('vegano')` |

Names follow `{verb}{Feature}.test.ts`. Alphabetical order is the Playwright order with `workers: 1`; no file depends on another's state. `describe` blocks carry the ids; every `test()` starts with its id. Tags: `@critical` on P1 TCs (TC-01, TC-02, TC-03, TC-15) so `smoke-api` picks them up.

## 6. Environment and CI notes (do not write CI)

| Need | Detail |
|---|---|
| Local stack | `supabase start` for Postgres, Auth, REST at port 54321; schema migrations and seed with the recipe catalogue (the report counted 562 and 267 recipes through the RPC) |
| Edge functions | `generate-meal-plan` and `delete-account` served locally with their own secrets; rate limiter active (5 per hour) |
| Personas | `alergia`, `vegano`, `familia` signed up with profiles declared (needs a seed or onboarding script; none exists in this repo) |
| Secrets | `LOCAL_ALERGIA_*`, `LOCAL_VEGANO_*`, `LOCAL_FAMILIA_*` email and password, `LOCAL_SUPABASE_ANON_KEY` (from `supabase status`), `TEST_ENV=local`, all from the CI secret store |
| Not needed | The web app on port 3000 and a browser (API only); Turnstile is off locally (UI session) |
| Command shape | `bun run test:integration` restricted to `tests/integration/menu-safety` (path argument), until the sample tests are removed |
| Fresh database per CI run | Resets the quota window and removes leftover menus |
| Staging | Out of scope: Auth requires a captcha |

## 7. Test-Design Checklist

```
[x] P1   Beyond "every AC passes": cross-user isolation, tampered token, anonymous, invalid body and week, quota 409
[x] P2   AC as floor: positive controls CHK-A1, CHK-B2, CHK-U4 added so denials cannot pass vacuously
[x] P3   Each case is a concrete exploration (named persona, table, payload row, week)
[x] P4   1:N: TC-08 -> 2 ATCs by outcome; TC-15 -> TC-15 + control CHK-B2; generation -> TC-01/02/03 + D1/D2/D3.
         Single-ATC justification: TC-15 negative is trivially atomic (one caller, one foreign id, parameter = victim);
         CHK-A1, CHK-U4 are single controls by design
[x] P5   Anomalies the AC is silent on: tampered token (C1), delete-account anonymous, week W00
[x] EP   Valid and each distinct invalid partition: missing field vs invalid value vs duplicate week vs foreign owner vs no credential vs tampered
[x] BVA  Household people 0/1/10/11, adults 0/1/=people/>people, children -1; week W00/W99. Dropped: W54, valid W01/W53 (quota), logged in section 4
[x] BVA-D N/A: nothing rounds or truncates a computed value in this scope
[x] ST   State: a week with an existing menu (CHK-D3); profile-change-after-menu (TC-10) is manual, out of scope
[x] DT   TC-08 conditions people x adults x children interact: rows chosen by decision table (accept 2, reject 5); sum rule row 4/1/0 deferred to PO
[x] PW   N/A: no scope has 3+ independently combinable factors beyond the DT above
[x] PARAM Same-behavior variants parameterized: CHK-A2 (3 tables x 2 victims), CHK-U1 (7 targets), CHK-C1 (2), CHK-B2 (2), CHK-D1 (2 rows), CHK-D2 (2 rows).
         Exception: TC-01/TC-02 separate by the TC-key mandate (section 3)
[x] RISK Prioritized P1 first; scope-driven drops: TC-02 10-week sweep, W54, 4/1/0, inactive recipes (API-01), shopping list (TC-03)
[x] OBS  Every precondition reachable on local: personas exist, future weeks free, quota available. Unreachable: none known;
         quota-exhausted state is handled by skip, not asserted
[x] SEED The derived value (21 slots, allergen-free) is produced through the real path: generate-meal-plan, then read the stored rows
```

## 8. Implementation order (one commit per step, Phase 2)

- [ ] 1. `config/variables.ts`: roles, `roleCredentials`, `supabaseAnonKey`
- [ ] 2. `playwright.config.ts`: `apikey` header on `integration`
- [ ] 3. `tests/data/types.ts` (`RoleState`), `tests/utils/roleState.ts`, `tests/utils/token.ts` (`tamperToken`), `DataFactory.futureIsoWeek`
- [ ] 4. `AuthApi.signInWithPassword` helper and `api-auth.setup.ts` role loop
- [ ] 5. `TestFixture` role option and `ApiFixture.asRole`
- [ ] 6. `api/schemas/*.types.ts` after the column check (Q3)
- [ ] 7. One commit per component with its test file: `ProfilesApi` + files 1 and 3 (A5 needs `asRole`), `AccessControlApi` + file 5, `RecipesApi` + file 6, `MealPlansApi` + files 2 and 4
- [ ] 8. `bun run kata:manifest`, stage, `kata:manifest:check`; run, types, lint

## 9. Risks and open questions

| ID | Risk | Mitigation |
|---|---|---|
| R1 | Rejected requests may consume quota (API-03) | Validation on `familia`; at most 4 rejections |
| R2 | A crash leaves `familia` household changed or menus undeleted | `finally` and `afterEach` cleanup; random far-future weeks avoid 409 next run; the pre-change snapshot is attached to the failure so `familia` can be restored by hand |
| R3 | Column and field names are not documented | Q3 gate before code |
| R4 | A5 against a broken RLS could alter a persona | No-op patch value |
| R5 | Sample `user-session.test.ts` fails on this backend | Path-filtered runs |
| R6 | Catalogue counts (562, 267) drift | Assert safety properties, never counts |
| R7 | `delete-account` anonymous call | Anonymous only; never with a token |

| Q | Question for the owner |
|---|---|
| Q1 | Approve `AccessControlApi` as a fourth component? |
| Q2 | Add the `CHK-*` checks to `docs/test-cases.md` as TCs, or keep provisional ids? |
| Q3 | Confirm column names (`user_profiles` household and allergen fields, owner column of each table, `meal_plan_recipes` slot columns, recipe `alergenos` and `dieta` fields) from the schema at Phase 2 start? |
| Q4 | Resolved: skip locally, fail when `CI` is set |
| Q5 | Are state-changing teardown calls helpers (planned) or ATCs? |
| Q6 | Row `4/1/0` and the TC-02 10-week sweep stay out until the PO answers F-05 and the quota is lifted for tests? |
| Q7 | Does `LOCAL_USER_*` exist in `.env`? Unverified; the plan drops the default-user sign-in |

## 10. Verification checklist (Phase 2 to 3)

- [x] `bun run kata:manifest:check` clean: 21 ids, no duplicate
- [ ] `bun run test` on `tests/integration/menu-safety` green on local, no retries
- [ ] `bun run types:check` and `bun run lint:check` clean; no comments in code; aliases only
- [ ] Each denial ATC has its control running first (CHK-A1, CHK-U4, CHK-B2)
- [ ] After a run: no leftover menus for the three personas; `familia` household equals its pre-run value
- [ ] A second run within the hour is skipped or reported, not silently passed
- [ ] Spec reviewer and standards reviewer report no blocker; lying-test check on every new assertion
- [ ] `docs/automation-eval.md` records the waivers of section 1

## 11. Review outcome

- Credentials are masked in Allure attachments.
- No skip on a rate limit in CI: `RateLimitError` plus `runUnlessRateLimited`.
- Positive controls: `CHK-A1`, `CHK-B2-1`, `CHK-B2-2`, `CHK-U4`.
- ATCs per outcome: B2-1/2, C1-1/2, U1-1/2/3; TC-02 distinct from TC-01 by the `Ensalada cesar` regression assertion.
- Fixed baseline: allergens and diets read from the stored persona profile; persona preconditions are failing `expect`s.
- Plan-id cleanup: ids recorded at generation, `cleanupMenus(planIds)` best-effort, `afterEach` asserts nothing is left.
- Environment guard: the run refuses an unintended environment.
- Helpers moved out of tests: `DataFactory.randomFutureIsoWeek()` and `MealPlansApi.findFreeWeek()`; CHK-D3 compares the set of recipe ids.

## 12. Known limits

- Messages are compared as text patterns.
- Tampered-token coverage is thin (2 targets, one method).
- Validation negatives are limited by the hourly quota.
- TC ids are not tracker keys (owner decision: no Jira).
- TC-01 and TC-02 are separate ATCs by owner mandate.
- The TC-01, CHK-D3 and TC-02 chain is one test with steps: a rate-limit skip mid-chain skips the whole test.
- The CHK-A5 before-versus-after comparison cannot fail by design; only the empty PATCH result detects a write.
- Control checks need the personas onboarded before the run (each owns a menu and consent rows).
- The sample template tests (`tests/integration/auth/user-session.test.ts`, `tests/integration/module-example/`, `tests/e2e/**`) are not part of this module and fail on this backend: module runs use a path filter until they are removed.
- Playwright traces on failure may contain request headers (local runs only).
