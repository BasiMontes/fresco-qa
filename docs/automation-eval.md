# Automation evaluation: Allergy-safe weekly menu

Evaluation of the test automation built for the Fresco menu feature: what was automated, why, how well it works, and where it stops. Sources are cited in parentheses. Anything not verified is labelled as such.

## 1. Summary

| Item | Value |
|---|---|
| Framework | KATA on Playwright and TypeScript, run with Bun (`package.json`) |
| Target | Local copy of the product (local Supabase, edge functions, web app). Staging is excluded because its login and auth API require a captcha (`docs/bitacora.md`) |
| API suite | 11 files in `tests/integration/menu-safety/`, 31 new ATC ids (`kata-manifest.json`) |
| UI suite | 4 files in `tests/e2e/menu-safety/`, 6 new ATC ids (`kata-manifest.json`) |
| ATCs in the manifest | 45 in total: 31 API (`TC-*`, `CHK-*`), 6 UI (`UI-TC-*`), 8 from the boilerplate samples (`PROJ-*`) (`kata-manifest.json`, `summary.totalATCs` = 45) |
| Pipeline | `.github/workflows/tests.yml`, passing on a GitHub runner on a fresh database (see section 5) |
| Jira | Not used for tests. Owner decision, see section 7 |

The "28 ATCs" figure in `docs/bitacora.md` and in the API progress log was the manifest total at that moment, which included the 8 sample ids. The API suite had 20 ATC ids at that point (`.session/test-automation/api-menu-safety/progress.md`) and has 21 after TC-04 was added (`kata-manifest.json`).

## 2. Coverage

### 2.1 Test cases

18 test cases exist (`docs/test-cases.md`). Six have a UI ATC and five have at least one API ATC; TC-01 and TC-03 have both.

| TC | Title | AC | API ATC | UI ATC | Status and reason |
|---|---|---|---|---|---|
| TC-01 | Egg-allergic couple, no egg recipes | AC-1 | `TC-01` | `UI-TC-01` | Automated at both levels |
| TC-02 | Repeated generations never include egg | AC-1 | `TC-02` | none | Automated for 2 weeks per run; the 10-week sweep is out because of the hourly quota (`api-menu-safety/automation-plan.md` section 4) |
| TC-03 | Vegan and lactose-free profile | AC-2 | `TC-03` | `UI-TC-03` | Automated at both levels; shopping list content not checked |
| TC-04 | Several allergens, union excluded | AC-1 | `TC-04` | none | Automated at API level: six parameterized rows through the filter RPC, with the profile snapshotted and restored (`test-specs/menu-safety-p1-gaps/`). Passes in CI |
| TC-05 | Lupin accepted | AC-1 | none | `UI-TC-05` | Automated at UI level: saves `altramuces` from the preferences screen, then generates a menu for the vegan persona. No recipe carries the tag, so the exclusion itself cannot be proven (F-06) |
| TC-06 | Very restrictive profile | AC-1, AC-3 | none | none | Manual by design (exploratory) |
| TC-07 | Shopping list scales | AC-5 | none | none | Not automated. The exact scaling rule is not documented |
| TC-08 | Household limits | AC-6 | `TC-08-1`, `TC-08-2` | none | Automated; row 4/1/0 excluded until the PO answers question 1 |
| TC-09 | Swap one slot | AC-4 | none | `UI-TC-09` | Automated for the add-to-menu flow only: one slot changes, it stays egg-free. What "swap" means for AC-4 is still open (PO-1) |
| TC-10 | Allergen added after generation | AC-7 | none | none | Manual: the expected behaviour needs PO confirmation |
| TC-11 | 21 slots, no repeated comida or cena | AC-3 | none | `UI-TC-11` | Automated at UI level. Mid-week partial menus are not tested; the test uses a future week |
| TC-12 | Account deletion removes health data | AC-8 | none | none | Not automated; needs a spare account and `delete-account` is never called by the suite |
| TC-13 | Free text flagged as unused | AC-9 | none | none | Manual |
| TC-14 | Free user can use filters | AC-10 | none | `UI-TC-14` | Automated. No paywall element is known, so the test asserts the save persists after reload and that the checkout dialog never opens (`ui-menu-safety/automation-plan.md` risk R6) |
| TC-15 | Cannot request another user's recipes | Security | `TC-15` | none | Automated |
| TC-16 | Vegan diet adds no silent allergens | AC-1, AC-8 | none | none | Not automated; candidate finding awaiting the PO |
| TC-17 | Over-budget warning | AC-11 | none | none | Not automated; candidate finding awaiting the PO |
| TC-18 | Photo contradicts allergen data | AC-1 | none | none | Manual, exploratory |

Totals from the table: 10 of 18 TCs have an automated ATC (TC-01, 02, 03, 04, 05, 08, 09, 11, 14, 15). 8 of 18 are not automated; 4 of those are manual by design (TC-06, 10, 13, 18).

Acceptance criteria with at least one automated check: AC-1, AC-2, AC-3, AC-4 (add-to-menu flow only), AC-6, AC-10 and the security criterion. No automated check covers AC-5, AC-7, AC-8, AC-9 or AC-11 (`docs/feature-test-plan.md`).

### 2.2 Extra API checks without a TC

24 ATC ids use the prefix `CHK-` because they come from the API session report or from the response-schema and CRUD assessment, not from a TC (`api-menu-safety/automation-plan.md` section 2.1). They cover:

- Cross-user isolation of profiles, menus and consents (`CHK-A1`, `CHK-A2`, `CHK-A5`).
- Anonymous access to four private tables, the filter RPC and two edge functions (`CHK-U1-1`, `CHK-U1-2`, `CHK-U1-3`).
- Tampered tokens on REST and on an edge function (`CHK-C1-1`, `CHK-C1-2`).
- Validation of the generate request and a duplicate week (`CHK-D1`, `CHK-D2`, `CHK-D3`).
- Filter RPC output against the stored allergens and diets (`CHK-B2-1`, `CHK-B2-2`).
- Positive controls so denials cannot pass vacuously (`CHK-A1`, `CHK-B2-1`, `CHK-B2-2`, `CHK-U4`, `CHK-E1`, `CHK-E4`).
- Response schema of the profile row and the catalogue row, checked at run time with zod (`CHK-S1`, `CHK-S2`). The menu steps validate every plan and slot row they read, so each menu test checks the schema too. The product ships no OpenAPI file, so the schemas are written by hand next to the types in `api/schemas/` and each one `satisfies` its type.
- Catalogue reads at the edges: unknown id, malformed id, unknown column and a range beyond the catalogue (`CHK-E1` to `CHK-E4`).
- Invalid profile writes and a duplicate insert, each leaving the profile unchanged (`CHK-E5` with three rows, `CHK-E6`).
- Deleting menus: an unknown plan deletes nothing and the owner's own menu disappears with its slots (`CHK-E7`, `CHK-E8`). Plan: `test-specs/api-schema-crud/automation-plan.md`.

### 2.3 Why these cases

The automated set was chosen on food-safety risk first: an allergen in a menu is risk R2, likelihood low, impact critical (`docs/feature-test-plan.md` section 7). The plan also states that the P1 cases were prioritised first. Cases that depend on open PO questions or on observations still marked as candidates were left manual.

## 3. Architecture

### 3.1 Layers

| Layer | Content in this project |
|---|---|
| Config | `config/variables.ts`: environment map, `auth.roles` (`alergia`, `vegano`, `familia`), `roleCredentials(role)` reading `<ENV>_<ROLE>_EMAIL` and `_PASSWORD` by variable name, `supabaseAnonKey` |
| Base | `ApiBase` (request helper, `apikey` header added when set, `RateLimitError` thrown on 429), `UiBase` |
| Domain | API: `RecipesApi`, `MealPlansApi`, `ProfilesApi`, `AccessControlApi` (new, approved by the owner), `AuthApi` (extended). UI: `CalendarPage`, `PreferencesPage`, `LoginPage` (selectors fixed) |
| Fixture | `ApiFixture` registers the new components and offers `asRole(role)`; `UiFixture` registers `calendar` and `preferences`; `TestFixture` has a `role` option |

(`api-menu-safety/automation-plan.md` sections 2.2 and 2.3; `ui-menu-safety/automation-plan.md` sections 3.2 to 3.4.) No ATC calls another ATC. No Steps module was added because Steps need 3 or more ATCs repeated in 3 or more files.

### 3.2 Authentication per role

- API: a setup project signs in each of the three personas through the Supabase password grant and writes `.auth/roles/<role>.json`. Tests choose a role with `test.use({ role })`. Tokens never reach Allure: credentials in attachments were a review blocker and were fixed (`progress.md`, Phase 3).
- UI: each test logs in through the real login form in `beforeEach`. Reasons: the steps of the TCs start with logging in, no quota cost, no stale storage state. The product session lives in cookies, so a bearer token cannot open the page (`ui-menu-safety/automation-plan.md` section 3.3).
- Hybrid UI tests read and clean data through the API with `fixture.api.asRole(role)`.
- The shipped `ui-setup` project (template login) does not match this product, so `e2e` and `smoke-ui` depend on `api-setup` instead (`playwright.config.ts`).

### 3.3 Quota helper

The product allows 5 menu generations per user per UTC hour (`docs/session-reports/api-session.md` section 2).

- `ApiBase` throws `RateLimitError` on 429 before any assertion. The UI intercepts the real `generate-meal-plan` response for the same reason, because the screen shows one generic message.
- Tests wrap generation calls in `runUnlessRateLimited`: skip locally with a reason (reported as not run), fail when `CI` is set (`tests/utils/quota.ts`, `automation-plan.md` section 4).
- Generations per run: API 3 successful for `alergia` (2) and `vegano` (1); UI 3 (one per persona). Combined, `alergia` uses 4 of 5 per hour. At most one run of both suites per hour (`ui-menu-safety/automation-plan.md` section 5).

### 3.4 Data strategy and cleanup

| Datum | Class | Handling |
|---|---|---|
| Persona profile | Discover | Read from the stored profile; a failing `expect` names the persona and property. Never skipped |
| Future ISO week | Generate | `MealPlansApi.findFreeWeek()` draws a week 2 to 40 weeks ahead and re-draws while a menu exists |
| Generated menu | Generate (by the product) | Plan ids recorded at generation; `afterEach` deletes by id or by week and asserts nothing is left |
| Household (API), diets and allergens (UI-TC-14) | Modify | Snapshot first, restore in `finally` through the API |
| Personas | Seeded | `scripts/ci/seed-personas.ts` creates the three profiles in CI. Locally they were created through the signup form because the repository doctrine forbids admin-created accounts (`docs/bitacora.md`) |

A crash can leave at most one menu in a far-future week, which later runs never reuse (`ui-menu-safety/automation-plan.md` section 5).

## 4. Quality gates

| Gate | Result | Source |
|---|---|---|
| Type check (`tsc --noEmit`) | Exit 0 at the end of each phase on the API side; UI phase recorded as green | API `progress.md`; UI `progress.md` |
| Lint (`eslint`) | Exit 0 on the API side; UI recorded as green | same |
| KATA manifest check | Clean, no duplicate ids; manifest now lists 32 ATCs | `progress.md`, `kata-manifest.json` |
| `bun run docs:check` | Passed at API close | API `progress.md` |
| Plan checklist | Test-Design Checklist applied (EP, BVA, state, decision table, controls) | `api-menu-safety/automation-plan.md` section 7 |

`bun run types:check` failed once with "Script not found check" before it was changed to run `tsc` directly (`progress.md`, Phase 2.2; commit `71f2aea`).

### 4.1 Review

API suite, two rounds, each with four reviewers: a spec reviewer, a standards reviewer and two blind judges.

- Round 1: REJECT from 4 of 4. Blockers confirmed by the orchestrator: credentials and tokens in 36 Allure files; the `@critical` generation tests running twice in one full run and spending the quota; no positive control for two tables in `CHK-A2`.
- Round 2: REJECT from the standards and spec reviewers, approve with warnings and REJECT from the blind judges. A new spec blocker was the orchestrator's own error: `testIgnore` had been placed in the wrong project, so the quota files ran in no project. It was fixed and verified by listing tests per project.
- Closed with documented waivers, not with a clean ACCEPT. No third full review was run.
- Fixed: credentials in Allure (0 sensitive files after a real login), 429 skip hiding failures in CI, double firing, missing controls, the `Ensalada cesar` assertion, fixed baseline from the stored profile, plan-id cleanup, environment guard.

UI suite: 4 reviewers reported no blocker. Fixes applied afterwards: `revealDay` now waits and is capped, the restore no longer masks a test failure, and the dashboard sample is excluded from the `e2e` project. After the fixes the four UI tests were re-run and passed, the review was accepted and the session archived (`.session/.archive/2026-11-22-test-automation-ui-menu-safety/progress.md`).

## 5. Results (verified facts only)

| Item | Status | Evidence |
|---|---|---|
| API suite, 19 Nov, local | Passed. 33 of 33 entries on the four files that spend no quota; `generateSafeMenu` (2 tests) passed once at 14:00 UTC; `rejectInvalidMenuRequests` 7 of 7 entries passed once; none skipped | API `progress.md`, Phase 3 closed |
| API suite since the UI work | Re-verified. Local `integration` project run on 22 Nov at 17:00 UTC: the 36 module tests passed. The only failures were the 2 boilerplate `PROJ-100` samples, which are now excluded in every project | archived UI `progress.md`; `playwright.config.ts` |
| UI-TC-14 | Passed locally and in CI | archived UI `progress.md`; CI run 45048787494 |
| UI-TC-01, UI-TC-03, UI-TC-11 | Passed locally after the `revealDay` fix (01 and 03 at 16:59 UTC, 11 at 17:00 UTC) and in CI | archived UI `progress.md`; CI run 45048787494 |
| CI workflow, first run | Failed, 41 of 43. The two failures were `CHK-A2` on `meal_plans` for vegano and familia: on a fresh database the victims own no menus, because every other test cleans up, so the isolation check failed its own vacuity guard. Locally it had passed thanks to menus left by earlier manual sessions | GitHub Actions run 45047765840, commit `d603233` |
| CI workflow, after the fix | Passed, 43 of 43, 0 skipped, about 6 minutes. The test now creates and deletes the victim menu itself | GitHub Actions run 45048787494, commit `2fcdde1` |
| CI workflow, with TC-04 | Passed, 49 of 49 entries (3 setup and teardown steps and 46 tests: 42 API and 4 UI), 0 skipped. The six TC-04 rows passed on a fresh database on their first run | GitHub Actions run 45060103577, commit `e1763be` |
| CI workflow, with UI-TC-05 and UI-TC-09 | Passed, 51 of 51 entries (3 setup and teardown steps and 48 tests: 42 API and 6 UI), 0 skipped, 0 not run. Both new tests passed on a fresh database on their first run | GitHub Actions run 45152503321, commit `148c565` |

State of the suite: 51 of 51 passing in CI on a fresh database at commit `148c565`. That workflow runs the `integration` and `e2e` projects only. `smoke-ui` (one `@critical` test, UI-TC-14) was verified locally on 22 Nov and no workflow runs it on its own, and repeated runs inside the same UTC hour are not covered. The inherited `smoke.yml` and `regression.yml` only run on manual dispatch, because their daily schedule failed against staging.

## 6. Flakiness and quota risks

| Risk | Detail | Mitigation |
|---|---|---|
| Hourly quota | 5 generations per user per UTC hour, fixed window. A spent window gives 429 | Skip with a reason locally (not run), fail in CI. One suite run per hour. A fresh database per CI run resets the window |
| Quota and shared users | `alergia` uses 4 of 5 generations in one combined run | Validation tests run as `familia`, who generates little |
| Rejected requests may use quota | Not isolated (API-03 in `docs/session-reports/api-session.md`) | Validation limited to 4 requests on `familia` |
| Skipped test hides a gap | A rate-limit skip inside the `TC-01`, `CHK-D3`, `TC-02` chain skips the whole test | Documented limit; CI fails instead of skipping |
| Calendar day columns | Not all days may render at 1920 px; `revealDay` pages through days | Fixed once after review; re-verified locally and in CI (section 5) |
| Selectors from product source | Written from source, probed live only partly | Role and test-id locators; no `waitForTimeout` |
| Personas must be onboarded | Control checks need each persona to own a menu and consent rows | `scripts/ci/seed-personas.ts` in CI; manual setup locally |
| Local stack stops | Docker went down at 14:08 UTC on 19 Nov and stopped all services | Recovery steps in `docs/bitacora.md` |
| Sample tests fail on this backend | `tests/integration/auth`, `module-example`, parts of `tests/e2e` | Path-filtered module runs; the dashboard sample is excluded from `e2e` |

## 7. Limits and waivers

Owner decision: KATA fully applied, with no Jira ceremony. Waived gates (`api-menu-safety/automation-plan.md` section 1, repeated in `ui-menu-safety/automation-plan.md` section 1):

| Gate | Decision |
|---|---|
| Jira TC source gate, signed ROI verdicts | Waived: `docs/test-cases.md` is the TC source |
| Three business context maps | Waived for this scope |
| `/test-framework-adaptation` | Waived; project-owned files adapted by hand |
| Jira transitions, labels, TMS sync | Not done (`tms.autoSync` stays `false`) |
| Everything else (KATA layers, ATC rules, lint, types, review) | Fully applied |

Known limits, API suite (`api-menu-safety/automation-plan.md` section 12):

- Messages are compared as text patterns.
- Tampered-token coverage is thin (2 targets, one method).
- Validation negatives are limited by the hourly quota.
- TC ids are not tracker keys (no Jira).
- TC-01 and TC-02 are separate ATCs by owner mandate.
- The TC-01, CHK-D3 and TC-02 chain is one test with steps: a rate-limit skip mid-chain skips the whole test.
- The CHK-A5 before-versus-after comparison cannot fail by design; only the empty PATCH result detects a write.
- Control checks need the personas onboarded before the run.
- The sample template tests are not part of this module and fail on this backend: module runs use a path filter until they are removed.
- Playwright traces on failure may contain request headers (local runs only).

Known limits, UI suite (`ui-menu-safety/spec.md`, "Known limits"):

- Allergen and diet verdicts are test-level assertions over an API readback of the stored menu; the UI ATC alone asserts 21 filled slots, not safety.
- The UI never displays allergens and shows a single diet tag per recipe (U-06), so no UI-only oracle exists for TC-01 and TC-03.
- Error messages are compared as text patterns; status is always exact.
- A spent hourly window is not run locally and fails in CI.
- Sample template tests (`tests/e2e/dashboard`, `tests/e2e/module-example`, `tests/integration/auth`, `tests/integration/module-example`) do not match this product.
- Staging is out of scope: login needs a captcha an automated browser cannot solve.

Additional limits from the plans:

- `TC-15` and `CHK-*` do not match a Jira key under project `QAFRESCO`. Harmless while `tms.autoSync` is `false`; revisit before enabling sync.
- The three-ATC split of TC-01, TC-03 and TC-11 in the UI suite, and TC-01 and TC-02 in the API suite, follows the owner's rule that the TC key is the id. Equivalence partitioning would use one parameterized ATC per behaviour (`ui-menu-safety/automation-plan.md` section 4).
- Candidate findings F-01 to F-06 and U-02 to U-05 are not asserted by any test, because none is confirmed with the PO (`docs/session-reports/ui-session.md` section 5).

## 8. ROI and maintenance

No signed ROI verdict exists; that gate was waived. The view below is a judgment from the code and the plans, not a measurement.

| Area | Value | Maintenance cost |
|---|---|---|
| Access control and isolation checks (`CHK-A*`, `CHK-U*`, `CHK-C*`, `TC-15`) | High: cheap, deterministic, no quota, they protect user health data | Low. Tied to table names and status codes |
| Filter output checks (`CHK-B2-*`) | High for the allergen promise; assert safety properties, not counts (the catalogue counts 562 and 267 can drift, risk R6) | Low |
| Menu generation (`TC-01/02/03`, `UI-TC-01/03/11`) | High for the core promise | Medium to high: they spend the quota, so runs are limited to one per hour and the data strategy needs cleanup |
| Calendar paging (`CalendarPage.revealDay`) | Needed to read all 21 slots | High: depends on layout, viewport and the day navigation; already fixed once; passes locally and in CI |
| Chip labels in `PreferencesPage` | Needed to select diet and allergen | High: matched by Spanish visible text (`Sin lactosa`, `Sésamo`), so a copy change breaks the test |
| Per-test form login | Keeps the login form under test | Low in cost per run; adds 4 logins and breaks on login selector changes |
| `UI-TC-14` paywall check | Weak oracle: asserts persistence and no checkout dialog, not a paywall element | Medium |
| Duplication of ATC ids across surfaces | None in code; shared private helpers | Cost is in the id rule, not in code |

Cheapest next gains: the controls and safety checks that need no quota. Costliest to keep: anything that clicks through the calendar and anything matched by Spanish text.

## 9. Next steps

1. Remove or exclude the boilerplate sample tests so module path filters are no longer needed (proposed `/framework-development` chore in `api-menu-safety/automation-plan.md` section 2.1).
2. Get PO answers to the open questions (`docs/feature-test-plan.md` section 9), then automate TC-10, TC-16 and TC-17, and the 4/1/0 household row.
3. Extend TC-09, which covers AC-4 for the add-to-menu flow only, once the product owner defines what AC-4 means: the product has no "regenerate one slot" feature although its FAQ promises it.
7. Decide whether the `CHK-*` ids become test cases in `docs/test-cases.md` (question Q2 of the API plan).
8. If Jira sync is ever enabled, rename the ids to tracker keys first.
