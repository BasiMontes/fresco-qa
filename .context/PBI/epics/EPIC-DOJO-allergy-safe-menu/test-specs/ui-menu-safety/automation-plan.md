# Test Automation Plan: ui-menu-safety

> Scope: module-driven, Medium, type e2e (UI with API readback). Created 2026-11-22. Status: Phase 1 plan, awaiting owner approval.
> Facts come from `docs/test-cases.md`, `docs/session-reports/ui-session.md`, the API plan, and the product source read-only. "Unverified" marks anything not seen in a live run.

## 1. Waived gates (same owner decisions as `api-menu-safety`)

| Gate | Decision |
|---|---|
| Jira TC source gate, signed ROI verdicts | Waived: `docs/test-cases.md` is the TC source |
| Three business context maps | Waived for this scope |
| `/test-framework-adaptation` | Waived; project-owned files are adapted by hand in Phase 2 |
| Jira transitions, labels, TMS sync | Not done (`tms.autoSync` stays `false`) |
| Everything else (KATA layers, ATC rules, lint, types, review) | Fully applied |

## 2. Readiness (checked read-only on 2026-11-22)

| Service | Check | Result |
|---|---|---|
| App `http://localhost:3000` | `curl` status | 200 |
| Supabase `http://127.0.0.1:54321` | `curl` `/auth/v1/health` | 200 |
| Turnstile off locally | Not checked live; documented by the UI session (empty site key) | Unverified now |
| Personas onboarded, Free plan, tour already seen | Not checked (credentials not opened) | Unverified |

## 3. Architecture decisions

### 3.1 ATC identity

| Decision | Value | Rationale |
|---|---|---|
| Id scheme | `UI-TC-<nn>`: `UI-TC-01`, `UI-TC-03`, `UI-TC-11`, `UI-TC-14` | The API suite already owns `TC-01` and `TC-03` in `MealPlansApi`; `findDuplicateAtcIds` fails `kata:manifest:check` when one id decorates 2 methods. The `UI-` prefix marks the surface and avoids the numeric suffix, which the API suite uses for outcome splits (`TC-08-1`) |
| Collision check | `kata-manifest.json` holds `PROJ-101/102/111/112/121/122/131/132`, `TC-01/02/03/08-1/08-2/15`, and `CHK-*` | No `UI-TC-*` id exists: no collision |
| Reuse | `PROJ-111` `LoginPage.loginSuccessfully` (called as setup of each test) | See 3.3 |

### 3.2 Components (Layer 3)

| Component | File | Action | ATCs | Why |
|---|---|---|---|---|
| `LoginPage` | `tests/components/ui/LoginPage.ts` | Extend (selectors only) | reuse `PROJ-111` | Its private selectors are `login-email-input`, `login-password-input`, `login-submit-button`, `login-error`; the product uses `email_input`, `password_input`, `login_submit_button`, `login_error_message`. Without this fix `PROJ-111` cannot work. No new ATC, no new id. Manifest line numbers shift, regenerate it |
| `CalendarPage` | `tests/components/ui/CalendarPage.ts` | New | `UI-TC-01`, `UI-TC-03`, `UI-TC-11` | Owns `/calendar`: week URL, generate button, 21 slots. Shared private helper `generateAndReadSlots(week)` (response interception, slots, names) |
| `PreferencesPage` | `tests/components/ui/PreferencesPage.ts` | New | `UI-TC-14` | Owns `/profile/preferences` and the Free-plan check on `/profile` (one locator, `pro_upsell_card`, inline until a second use) |
| `UiFixture` | `tests/components/UiFixture.ts` | Extend | none | Register `calendar` and `preferences` |
| `MealPlansApi` | `tests/components/api/MealPlansApi.ts` | Extend | none | Two `@step` helpers: `readMenuForWeek(week)` (public wrapper of the private `readMenu`), `deleteMenuForWeek(week)` (list own plans, delete the plan of that week, return ids it could not delete) |
| `ProfilesApi` | `tests/components/api/ProfilesApi.ts` | Extend | none | One `@step` helper `restoreDietaryPreferences(snapshot)`; type `DietaryPreferences` added to `api/schemas/profiles.types.ts` (alergenos plus the 7 `dieta_*` flags) |
| `ApiBase` | `tests/components/api/ApiBase.ts` | Extend | none | `buildHeaders` adds `apikey` from `config.auth.supabaseAnonKey` when set. Needed because the API suite gets `apikey` only from the `integration` project headers, and the `e2e` project has none. Alternative rejected: put `apikey` in the `e2e` project `extraHTTPHeaders`, which would also tag every browser request |
| Steps | none | None | none | Steps need 3+ ATCs repeated in 3+ files; here two files, no repeated chain |

No ATC calls an ATC. `UI-TC-01`, `UI-TC-03` and `UI-TC-11` call the same private helper, which is not an ATC.

### 3.3 Authentication (decided)

| Option | Verdict | Reason |
|---|---|---|
| Per-test UI login through the form (`PROJ-111`) in `beforeEach` | Chosen | TC steps start with "log in as persona"; 4 logins per run, no quota cost; no storage-state staleness; keeps the form under test |
| Reuse per-role storage state from a setup project | Rejected | Needs a new setup that signs in 3 roles through the form anyway, a per-role `storageState` helper and project edits; saves seconds only |
| Reuse `.auth/roles/<role>.json` tokens as browser session | Rejected | The product session lives in cookies written by its own client; a bearer token does not open the page |

Consequences for `playwright.config.ts` (project-owned):

- Projects `e2e` and `smoke-ui`: replace `dependencies: ['ui-setup']` by `['api-setup']` and drop `use.storageState`. The shipped `ui-auth.setup.ts` logs in `config.testUser` through template selectors and the `/api/auth/login` endpoint, which this product does not have: left as is it would fail and block every e2e test. The file stays in place, unused.
- `api-setup` is required because hybrid tests read `.auth/roles/<role>.json` through `api.asRole(role)`.
- `smoke-ui`: add `testIgnore: ['**/menu-safety/generateSafeMenuViaCalendar.test.ts']`, same reason as `smoke-api` (quota).

### 3.4 Fixture per test (decided)

`{ test }` (hybrid), destructured as `{ test: fixture }` with `const { ui } = fixture` and `const api = fixture.api.asRole(role)`. `TestFixture.api` loads the default `api-state.json`, which does not exist in this project; `asRole` is already public on `ApiFixture` and builds a role-bound sibling on the same `request`. No `TestFixture` change. The `role` option fixture belongs to the `{ api }` fixture only and is not used here.

### 3.5 Helper versus ATC (rule 7)

| Call | Kind | Reason |
|---|---|---|
| Generate the week by clicking `generate_week_button` | Inside ATCs `UI-TC-01/03/11` | State change is the outcome under test |
| Save diet and allergen chips | ATC `UI-TC-14` | Outcome under test |
| `goto(week)`, `goto()`, `confirmFreePlan()` | `@step` | Navigation and precondition observation, no business outcome of their own |
| API `getOwnProfile`, `readMenuForWeek`, `findFreeWeek` | `@step` helpers | Discover and verify |
| API `deleteMenuForWeek`, `restoreDietaryPreferences` | `@step` helpers | Teardown of data the test created or changed; same Q5 as the API plan |

## 4. ATC registry

New ATCs (4). Reuse: `PROJ-111`.

| ATC id | Component.method | Type | Fixture / persona | Source | Technique | Data |
|---|---|---|---|---|---|---|
| `UI-TC-01` | `CalendarPage.generateMenuForEggAllergicPersona(week)` | Mutation | `{ test }` / alergia | TC-01 | EP valid, 21 slots | Generate free week, Discover profile, cleanup by week |
| `UI-TC-03` | `CalendarPage.generateMenuForVeganLactoseFreePersona(week)` | Mutation | `{ test }` / vegano | TC-03 | EP valid, stacked diets | Generate free week, Discover profile, cleanup by week |
| `UI-TC-11` | `CalendarPage.generateFullWeekWithoutRepeatedMeals(week)` | Mutation | `{ test }` / familia | TC-11 | EP valid, no-restriction profile | Generate free week, cleanup by week |
| `UI-TC-14` | `PreferencesPage.saveDietAndAllergenFiltersOnFreePlan(selection)` | Mutation | `{ test }` / alergia | TC-14 | EP valid, one diet and one allergen | Modify own profile, snapshot first, restore in `finally` |

Detail per ATC in `atc/<ATC-ID>.md`. Fixed assertions live inside each ATC; test-level assertions are the API readback verdicts. Expected values are literals from the TC (`huevo`, `vegano`, `sin_lactosa`, 21, 14), never recomputed from the response.

Why three generation ATCs and not one parameterized ATC: they share precondition and action, so EP says one ATC with persona rows. They stay separate because the owner requires the TC key as id and one id cannot sit on two methods; the shared flow lives in an undecorated private helper, so no code is duplicated. Alternative if the owner prefers EP purity: one ATC `UI-TC-01` called with three personas and the other two TCs recorded as "covered by `UI-TC-01` rows".

## 5. Test data classification

| Datum | Class | Source | Placement | Cleanup |
|---|---|---|---|---|
| Role credentials, anon key | Config | `.env` by variable name through `config.auth.roleCredentials(role)` and `config.auth.supabaseAnonKey` | login step | none |
| Persona profile (allergens, diets, household) | Discover | `api.profiles.getOwnProfile()` on the role-bound fixture; a failing `expect` names the persona and the property (never skip) | test | none |
| Free plan | Discover (observed in UI) | `PreferencesPage.confirmFreePlan()`: `pro_upsell_card` visible on `/profile`; a failing `expect` otherwise | test | none |
| Free future ISO week | Generate | `api.mealPlans.findFreeWeek()` (offset 2 to 40 weeks, re-drawn while a plan exists for it); the UI opens `/calendar?semana=<semana_iso>` directly. The week navigation arrows are bounded to plus or minus 2 weeks, a direct URL is not | test | none |
| Generated menu | Generate (by the product) | click on `generate_week_button` | test | `afterEach`: `api.mealPlans.deleteMenuForWeek(week)`, returned leftovers asserted empty |
| Stored menu rows | Discover | `api.mealPlans.readMenuForWeek(week)` | test | none |
| Chips for TC-14: diet `Sin lactosa`, allergen `Sesamo` (value `sesamo`) | Modify | Chosen as not locked by `impliedAlergenos` (only sin gluten, vegetariano, vegano lock allergens) and not part of any persona. Precondition: both unset in the snapshot (failing `expect`) | test | `finally`: `api.profiles.restoreDietaryPreferences(snapshot)` |

Quota (5 per user per UTC hour, fixed window; 409 for a week that has a menu; same user and week always give the same menu):

| Rule | Behavior |
|---|---|
| Generations per run | 3: alergia 1, vegano 1, familia 1; none in `UI-TC-14` |
| Combined with the API suite | alergia 3 plus 1 = 4 of 5, vegano 1 plus 1 = 2 of 5, familia 0 plus 1 = 1 of 5. At most one run of both suites per hour |
| 429 handling | `CalendarPage` intercepts the real `generate-meal-plan` response (`UiBase.interceptResponse`); status 429 throws `RateLimitError` before any assertion; tests wrap each generation in `runUnlessRateLimited` (skip locally with a reason, fail when `CI` is set). The UI alone cannot tell a 429 from other failures (it shows one generic message), which is why the response is intercepted |
| 409 and 422 | A free random week should not hit 409; if it does, the ATC fails with the week in the message. 422 (catalogue too small) fails too |
| Past weeks | Never drawn: the button is disabled for them |

Re-runnability: each run draws a new free week, deletes the week it created through the API in `afterEach`, restores the `alergia` profile in `finally`, and asserts both. A crash leaves at most one menu in a far-future week (never reused, `findFreeWeek` skips used weeks) and a pre-change snapshot attached to the failure for manual restore.

## 6. Test files

All under `tests/e2e/menu-safety/`. Names follow `{verb}{Feature}.test.ts`; `describe` blocks carry the ids; every `test()` title starts with its id.

| # | File | Persona | Fixture | Tests | Notes |
|---|---|---|---|---|---|
| 1 | `generateSafeMenuViaCalendar.test.ts` | alergia, vegano, familia (three describes) | `{ test }` | `UI-TC-01: should show 21 egg-free dishes when the profile declares egg allergy`, `UI-TC-03: should show 21 vegan lactose-free dishes when both diets are active`, `UI-TC-11: should show 21 slots with no repeated comida or cena when the profile has no restriction` | `beforeEach` logs in through the form; `afterEach` deletes the created menu and asserts none left. `@critical` on `UI-TC-01`, `UI-TC-03` |
| 2 | `setDietaryFilters.test.ts` | alergia | `{ test }` | `UI-TC-14: should save a diet and an allergen without a paywall when the user is on the Free plan` | Modifies `alergia`; `finally` restore. Runs after file 1 (alphabetical) so a failed restore cannot affect its generation |

Pre-condition expects at the top of each test: stored allergen or diet flags of the persona, and Free plan for `UI-TC-14`. Locators stay inline in the components until used twice. No `waitForTimeout`, `networkidle` or `waitForSelector`. The first-visit tour and the re-consent dialog are handled by a Playwright `addLocatorHandler` registered once in the component that lands on the page (`tour_overlay`, click `tour_skip_button`), not by a sleep.

## 7. Implementation order (Phase 2, one commit per step)

- [ ] 1. `ApiBase.buildHeaders` adds `apikey`; `playwright.config.ts`: `e2e` and `smoke-ui` depend on `api-setup`, no `storageState`, `smoke-ui` testIgnore
- [ ] 2. `LoginPage` selectors fixed; `bun run types:check`
- [ ] 3. `MealPlansApi.readMenuForWeek` and `deleteMenuForWeek`; `ProfilesApi.restoreDietaryPreferences` with its schema type
- [ ] 4. `CalendarPage`, `UiFixture` registration, `generateSafeMenuViaCalendar.test.ts`
- [ ] 5. `PreferencesPage`, `setDietaryFilters.test.ts`
- [ ] 6. `bun run kata:manifest`, stage, `kata:manifest:check`; run, types, lint

## 8. Environment and CI notes (do not write CI)

| Need | Detail |
|---|---|
| Local stack | As the API plan: Supabase, migrations and catalogue, edge function `generate-meal-plan` with the 5 per hour limiter |
| App | `next` served on port 3000 against the local stack with the public Turnstile site key empty (UI session section 7) |
| Browser | Chromium (`bun run pw:install`); viewport 1920x1080 from the config |
| Secrets | `LOCAL_ALERGIA_*`, `LOCAL_VEGANO_*`, `LOCAL_FAMILIA_*`, `LOCAL_SUPABASE_ANON_KEY`, `TEST_ENV=local` |
| Command shape | `bun run test:e2e tests/e2e/menu-safety` (path filter, until the sample tests are removed). Smoke excludes the generation file |
| Staging | Out of scope (captcha) |

## 9. Risks and open questions

| ID | Risk | Mitigation |
|---|---|---|
| R1 | All 7 day columns may not render at 1920 px; slots hidden behind `calendar_day_nav` would fail visibility | Verify in a live run at the start of Phase 2; if needed the ATC pages through the days with the day arrows |
| R2 | Selectors come from product source, never run: `password_input` is the default of the shared control, the slot `h2` is the recipe name | Phase 2 live probe with `playwright-cli` and persona creds by variable name before writing locators |
| R3 | A persona may be Pro or have the tour unseen | Free plan is a failing precondition; the tour is dismissed by the locator handler |
| R4 | Editing `alergia` can leave extra filters if the restore fails | `finally` restore through the API, snapshot attached on failure, file runs after generation |
| R5 | UI-TC-11 "no repeated comida or cena" is ambiguous (within each type or across both) | Assert across the 14 slots combined (stricter); the DB session found 0 repeats; confirm on the first run |
| R6 | `UI-TC-14` "paywall" has no known visual; the only upgrade surface seen is `pro_checkout_dialog` and `pro_upsell_card` | Assert the save succeeds, the chips persist after reload, and the checkout dialog never opens; weaker than a named paywall element |
| R7 | The `apikey` change touches `ApiBase`, shared with the API suite | Additive header, equal to the one the `integration` project already sends; re-run the API suite typecheck |
| R8 | Hourly quota shared with the API suite | One run of both per hour; NOT RUN locally, failure in CI |

| Q | Question for the owner |
|---|---|
| Q1 | Approve the `UI-TC-<nn>` id scheme and the three-ATC split for TC-01, TC-03, TC-11? |
| Q2 | Approve dropping the `ui-setup` dependency from `e2e` and `smoke-ui` (the template login does not match this product) and the per-test form login? |
| Q3 | Approve the `ApiBase` `apikey` change? |

## 10. Verification checklist (Phase 2 to 3)

- [ ] `bun run kata:manifest:check` clean: 4 new ids, no duplicate, `PROJ-111` still present
- [ ] `bun run test:e2e tests/e2e/menu-safety` green on local, no retries
- [ ] `bun run types:check` and `bun run lint:check` clean; no comments in code; aliases only
- [ ] After a run: no leftover menus for the three personas; `alergia` filters equal their pre-run values
- [ ] A second run within the hour is skipped or reported, not silently passed
- [ ] Lying-test check on every assertion: each can fail (a stubbed menu with one `huevo` recipe fails `UI-TC-01`; a menu with a duplicated dinner fails `UI-TC-11`; a Pro user fails `UI-TC-14` at its precondition)
- [ ] API suite still compiles and its `integration` project is unchanged in behavior

## 11. Review outcome

Pending Phase 3.
