# ui-menu-safety: UI automation batch spec

| Field | Value |
|---|---|
| Scope | Module-driven, Medium, slug `ui-menu-safety` |
| Surface | UI plus API readback (hybrid), fixture `{ test }`, Playwright project `e2e` |
| Environment | `local` only: app `http://localhost:3000`, Supabase `http://127.0.0.1:54321`. Staging cannot be driven past the login (Turnstile, `docs/session-reports/ui-session.md` section 1) |
| Personas | `alergia` (huevo, 2 adults), `vegano` (vegano + sin lactosa, 1 adult), `familia` (2 adults, 2 children); already signed up and onboarded |
| Credentials | `LOCAL_<ROLE>_EMAIL`, `LOCAL_<ROLE>_PASSWORD`, `LOCAL_SUPABASE_ANON_KEY` (names only) |
| Source of cases | `docs/test-cases.md` (owner-approved TC source), `docs/session-reports/ui-session.md`, `docs/feature-test-plan.md` |
| Status | Phase 1 plan, awaiting owner approval. No code written |

Facts come only from those documents and from the product source read-only (`~/fresco/fresco-app`). Anything marked (inferred) or "unverified" must be confirmed in Phase 2 before it is asserted.

## TCs in scope

Bodies live in `docs/test-cases.md`; they are not restated here.

| TC | Title | ATC | Persona | Coverage note |
|---|---|---|---|---|
| TC-01 | Egg-allergic couple gets a menu without egg recipes | `UI-TC-01` | alergia | UI generation on the calendar, 21 slots filled, stored menu has zero `huevo`, UI names equal stored names. Screenshot evidence is an Allure attachment, not an assertion |
| TC-03 | Vegan and lactose-free profile gets only matching recipes | `UI-TC-03` | vegano | Menu recipes only; every stored recipe `vegano` and `sin_lactosa` true. Shopping list (second half of the TC) not covered |
| TC-11 | A normal profile gets 21 slots with no repeated comida or cena | `UI-TC-11` | familia | Future week only: 21 slots, 14 comida and cena names distinct. The mid-week half (12 of 21, PO question 6) is dropped |
| TC-14 | A Free user can use diet and allergy filters | `UI-TC-14` | alergia | Free plan observed on the UI, diet and allergen saved without a paywall, persisted after reload |

Out of scope: TC-16 and TC-17 (candidate findings that fail today), TC-02, TC-04 to TC-10, TC-12, TC-13, TC-15, TC-18 (API or manual).

## Product facts used (read from source, unverified in a live run)

| Fact | Source |
|---|---|
| `/login` form: `email_input`, `password_input` (default of the shared password control), `login_submit_button`, `login_error_message`; success goes to `/menu` | `app/login/page.tsx`, `components/ui/password-input.tsx`, `lib/auth/login-redirect.ts` |
| `/calendar?semana=YYYY-Www` shows any valid week; empty week renders `calendar_empty_state` with `generate_week_button` (disabled only for past weeks) | `app/(app)/calendar/page.tsx`, `components/calendar/generate-week-button.tsx` |
| Week navigation links reach only current week plus or minus 2, but a direct URL is not bounded by that | `components/calendar/week-navigation.tsx` |
| Slot cell `calendar_slot_<dia>_<tipo>` with `dia` in lunes..domingo and `tipo` in desayuno, comida, cena; recipe name is the `h2` inside; empty slot shows `calendar_slot_<dia>_<tipo>_sin_receta` or `_excluida` | `components/calendar/slot-cell.tsx`, `slot-content.tsx` |
| Visible day columns depend on container width (`MAX_VISIBLE_DAYS = 7`); `calendar_day_nav` appears on overflow | `components/calendar/use-visible-day-window.ts`, `calendar-grid.tsx` |
| Preferences form at `/profile/preferences`: diet chips and allergen chips both share one test id each (`preferencia_dieta_option`, `preferencia_alergeno_option`), distinguished by text and `aria-pressed`; save button `actualizar_preferencias_button`; success `preferencias_saved_message` | `components/profile/preferences-form.tsx` |
| Free plan shows `pro_upsell_card` on `/profile` | `components/profile/profile-plan-cards.tsx` |
| Pro checkout appears as `pro_checkout_dialog` | `components/profile/pro-checkout-summary.tsx` |
| First-visit tour overlay `tour_overlay` with `tour_skip_button`; auto starts only when not yet seen | `components/onboarding/first-visit-tour/first-visit-tour.tsx`, `app/(app)/layout.tsx` |
| Generation request: `POST /functions/v1/generate-meal-plan`, 5 per hour per user, 409 for a week with a menu | `docs/test-cases.md`, API plan |

## Test-Design Checklist

```
[x] P1   Beyond "every AC passes": UI menu is cross-checked against the stored menu (names equal), not only displayed;
         the allergen verdict comes from the database rows, not from what the UI happens to show
[x] P2   AC as floor: positive controls inside the tests: persona precondition expects (huevo stored, vegano and
         sin_lactosa stored, Free plan visible) fail loudly instead of passing vacuously
[x] P3   Each case is a concrete exploration: named persona, a drawn free future week, named chips (Sin lactosa, Sesamo)
[x] P4   Single-ATC justification per TC: TC-01, TC-03, TC-11, TC-14 each have one flow and one outcome in the UI scope;
         the 1:N expansion of AC-1 and AC-2 is already in the API suite (TC-01, TC-02, TC-03, CHK-B2-*)
[x] P5   Anomaly the AC is silent on: UI shows a single diet tag per recipe (U-06), so the diet verdict is never asserted
         from the tag; a 429 on generation is NOT RUN, never a pass
[x] EP   Valid partitions per persona: allergen only, stacked diets, no restriction, Free-plan filter edit.
         Invalid partitions (409, 400, tampered) belong to the API suite
[x] BVA  N/A in the UI scope: no range is entered by the user; week boundary and household limits are covered by API TC-08
         and CHK-D2
[x] BVA-D N/A: nothing rounds or truncates a computed value in these four cases
[x] ST   Week with or without a menu is the only state; the 409 transition is API CHK-D3. Past weeks (button disabled) and
         the current week (days already past stay empty) are dropped, see RISK
[x] DT   N/A: TC-14 varies one diet and one allergen, no interacting conditions are tested
[x] PW   N/A: fewer than 3 independently combinable factors
[x] PARAM Same-behavior variants parameterized: UI-TC-01, UI-TC-03, UI-TC-11 share one private generate-and-read helper in
          CalendarPage (same action, different persona and different verdict). They stay three ATCs because each TC has its own
          ATC id by owner mandate and one id cannot sit on two methods (same exception as API TC-01 and TC-02)
[x] RISK P1 first (UI-TC-01, UI-TC-03). Scope-driven drops: TC-03 shopping list, TC-11 mid-week and Monday-of-current-week half,
         TC-01 and TC-03 repeated generations (quota), staging (captcha), TC-14 on a Pro user and TC-14 allergen lock rules
[x] OBS  Reachable on local: personas exist, future weeks free, quota available. Unreachable and logged: staging login
         (BLOCKED, Turnstile), Pro user (no fixture identity), quota-exhausted state (NOT RUN, not asserted)
[x] SEED The derived value (21 filled slots, allergen-free) is produced through the real product path: UI click on
         generate_week_button, then read of the stored rows
```

## Automation Plan

| Item | Value |
|---|---|
| Files | `generateSafeMenuViaCalendar.test.ts` (UI-TC-01, UI-TC-03, UI-TC-11), `setDietaryFilters.test.ts` (UI-TC-14), in `tests/e2e/menu-safety/` |
| Order | Alphabetical with `workers: 1`: generation file first, then the one that edits the `alergia` profile |
| Blocked by | Local stack up (verified: app 200, Supabase auth health 200), Turnstile off locally, personas onboarded, framework edits of the plan section 7 steps 1 to 3 |
| Whole-scope preconditions | Quota windows: `alergia` 1 of 5, `vegano` 1 of 5, `familia` 1 of 5 for this suite; the API suite adds 3 for `alergia` and 1 for `vegano`. At most one run of both suites per hour |

## Acceptance Criteria

- [ ] 4 TCs mapped to 4 new ATCs with unique `@atc` ids (`UI-TC-01`, `UI-TC-03`, `UI-TC-11`, `UI-TC-14`) plus reuse of `PROJ-111`
- [ ] At most 3 generations per run (one per persona); every created menu deleted by plan id with leftovers asserted empty
- [ ] `alergia` profile equals its pre-run value after `UI-TC-14`, even when the test fails
- [ ] `bun run test:e2e` restricted to `tests/e2e/menu-safety`, `types:check`, `lint:check` green on local, no retries

## Known limits

- Allergen and diet verdicts are test-level assertions over an API readback of the stored menu; the UI ATC alone asserts 21 filled slots, not safety.
- The UI never displays allergens, and shows a single diet tag per recipe (U-06): no UI-only oracle exists for TC-01 and TC-03.
- Error messages are compared as text patterns, status is always exact.
- TC ids are not tracker keys (owner decision: no Jira, `tms.autoSync` stays false).
- Quota: a spent hourly window is NOT RUN locally and a failure in CI.
- Playwright traces on failure may contain request headers (local runs only).
- The sample template tests (`tests/e2e/dashboard`, `tests/e2e/module-example`, `tests/integration/auth`, `tests/integration/module-example`) are not part of this module and do not match this product: module runs use a path filter until they are removed.
- Staging is out of scope: login needs a captcha an automated browser cannot solve.
