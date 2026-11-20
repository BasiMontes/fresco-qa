# api-menu-safety: API automation batch spec

| Field | Value |
|---|---|
| Scope | Module-driven, slug `api-menu-safety` |
| Surface | API only, fixture `{ api }`, Playwright project `integration` |
| Environment | `local`: Supabase at `http://127.0.0.1:54321` (REST, Auth, edge functions) |
| Personas | `alergia` (huevo, 2 adults), `vegano` (vegano + sin lactosa, 1 adult), `familia` (2 adults, 2 children); already signed up |
| Credentials | `LOCAL_<ROLE>_EMAIL`, `LOCAL_<ROLE>_PASSWORD`, public key `LOCAL_SUPABASE_ANON_KEY` (names only) |
| Source of cases | `docs/test-cases.md` (owner-approved replacement for signed Jira Candidates) and `docs/session-reports/api-session.md` (checks A1-A6, B1-B3, C1-C2, D1-D3, anonymous checks) |
| Status | Implemented and reviewed (round D2b). The generation and validation files are verified statically until the quota window allows a run |

Only sources: the two documents above. Anything marked (inferred) is not documented and must be confirmed in Phase 2 before it is asserted.

## TCs in scope

Bodies live in `docs/test-cases.md`; they are not restated here.

| TC | Title | Automation here | Coverage note |
|---|---|---|---|
| TC-01 | Egg-allergic couple gets a menu without egg recipes | ATC `TC-01` | API variant: 21 slots and zero `huevo`; the UI screenshot part is out of scope |
| TC-02 | Repeated generations never include an egg recipe | ATC `TC-02` | 1 extra future week per run (2 weeks total with TC-01); also asserts no recipe named `Ensalada cesar` (regression F-02); the quota blocks the 10-week sweep |
| TC-03 | Vegan and lactose-free profile gets only matching recipes | ATC `TC-03` | Allergens read from the stored profile, not hard-coded; menu recipes only; shopping list not covered |
| TC-08 | Household size limits are enforced | ATCs `TC-08-1`, `TC-08-2` | Split by outcome (accept vs reject); row `4/1/0` dropped until PO answers F-05 |
| TC-15 | A user cannot request another user's filtered recipes | ATC `TC-15` | Plus positive controls `CHK-B2-1`, `CHK-B2-2` |

## Checks from the API session report (no TC exists yet)

Provisional ids `CHK-<report id>` give each check a stable `@atc` id; an id gets a numeric suffix when the check splits by outcome. TC ids are not Jira keys.

| ATC id | Report rows | Meaning |
|---|---|---|
| CHK-A1 | A1 | Own profile list returns exactly one row |
| CHK-A2 | A2, A3, A4 | Another user's profile, menus, consents return 0 rows |
| CHK-A5 | A5, A6 | Updating another user's profile changes 0 rows; victim unchanged |
| CHK-B2-1 | B2 | Filter RPC returns no recipe with a declared allergen |
| CHK-B2-2 | B3 | Filter RPC returns only recipes matching the declared diet |
| CHK-C1-1 | C1 | Tampered token is rejected on REST |
| CHK-C1-2 | C2 | Tampered token is rejected on the edge function |
| CHK-D1 | D1 | Generate with missing fields returns 400 |
| CHK-D2 | D2 | Generate with an invalid ISO week returns 400 |
| CHK-D3 | D3 | Generate for a week that already has a menu returns 409 |
| CHK-U1-1 | anonymous table | Anonymous read of private tables is denied |
| CHK-U1-2 | anonymous RPC | Anonymous call to the filter RPC is denied |
| CHK-U1-3 | anonymous edge | Anonymous call to the edge functions is denied |
| CHK-U4 | anonymous catalogue | Anonymous read of the public recipe catalogue works (control) |

Not automated, by decision: E1 (10 generations, impossible under the quota), E2/E3 (folded into TC-01/TC-02), F1 (cleanup, a helper), anonymous inactive recipes (API-01 is a PO question, not a rule).

## Automation Plan

| Item | Value |
|---|---|
| Order | `enforceHouseholdLimits`, `generateSafeMenu`, `isolateUserData`, `rejectInvalidMenuRequests`, `rejectUnauthorizedAccess`, `restrictFilteredRecipes` (alphabetical; only quota use makes order matter, see plan) |
| Shared fixtures | `api` bound to a role through `test.use({ role })`; `api.asRole(other)` for victim reads |
| Blocked by | Local stack up; three personas provisioned; column names of `user_profiles`, `meal_plans`, `meal_plan_recipes`, `recipes` confirmed (open question Q3) |
| Whole-scope preconditions | Quota windows of `alergia` and `vegano` not exhausted; run the suite at most once per hour |

## Acceptance Criteria

- [x] 5 TCs and 10 provisional checks mapped to 21 ATCs, each with a unique `@atc` id
- [x] At most 2 generation tests per run; every created menu deleted by plan id, with leftovers asserted empty
- [x] Every 401/400/409 assertion has a positive control proving the check can fail
- [ ] `bun run test` on `tests/integration/menu-safety`, `types:check`, `lint:check` green on local

## Review outcome

- Credentials are masked in Allure attachments.
- A 429 never skips inside the component: the request helper throws `RateLimitError`; tests wrap each generation call in `runUnlessRateLimited` (skip locally with a reason, fail when `CI` is set).
- Positive controls added: `CHK-A1`, `CHK-B2-1`, `CHK-B2-2`, `CHK-U4`.
- ATCs split per outcome: `CHK-B2-1/2`, `CHK-C1-1/2`, `CHK-U1-1/2/3`; TC-02 asserts the `Ensalada cesar` regression.
- Fixed baseline: allergens and diets come from the stored persona profile; persona preconditions are failing `expect`s, never skips.
- Cleanup by plan id: the generation helper records created plan ids, `cleanupMenus(planIds)` deletes best-effort and `afterEach` asserts nothing is left.
- Environment guard: the suite refuses to run against an environment other than the intended one.

## Known limits

- Error messages are compared as text patterns.
- Tampered-token coverage is thin: 2 targets, one tampering method.
- Validation negatives are limited by the hourly quota.
- TC ids are not tracker keys (owner decision: no Jira).
- TC-01 and TC-02 are separate ATCs by owner mandate.
- The TC-01, CHK-D3 and TC-02 chain is one test with steps: a rate-limit skip mid-chain skips the whole test.
- The CHK-A5 before-versus-after comparison cannot fail by design; only the empty PATCH result detects a write.
- Control checks need the personas onboarded before the run (each owns a menu and consent rows).
- The sample template tests (`tests/integration/auth/user-session.test.ts`, `tests/integration/module-example/`, `tests/e2e/**`) are not part of this module and fail on this backend: module runs use a path filter until they are removed.
- Playwright traces on failure may contain request headers (local runs only).
