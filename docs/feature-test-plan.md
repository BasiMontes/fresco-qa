# Feature Test Plan: Allergy-safe weekly menu

| Field | Value |
|---|---|
| Product under test | Fresco, a weekly menu planner for Spain |
| Environment | Staging (`https://fresco-pre.vercel.app/`, black-box) for public pages and the database; a local stack of the product for authenticated flows, because staging login is blocked by a captcha |
| Feature | Weekly menu generation that respects declared allergens and diets |
| Story ID | TBD (assign when the Story is created) |
| Author | QA, DOJO final project |
| Date | 2026-11-19 |
| Status | Draft. Acceptance criteria are derived by QA and need PO confirmation where marked |

## 1. Story

As a person with food restrictions, I want my weekly menu to exclude the allergens I declare and respect my diet, so that I can cook it without checking every recipe.

## 2. How the criteria were derived

No Story or specification exists for this feature. The acceptance criteria below were derived from three sources, and every criterion names its source:

| Source | What it gives | Confidence |
|---|---|---|
| Public contract: landing page and FAQ of `fresco-pre` | What the product promises to a user | Medium: marketing text, not a specification |
| Read-only database inspection (`session-reports/db-session.md`) | Real data model, constraints and the filter function | High for structure, low for behaviour (7 profiles, 20 menus) |
| Exploratory UI session | Signup, onboarding and menu generation for the three personas on a local stack of the product | Medium: one run per persona |

A criterion marked **NEEDS PO CONFIRMATION** is inferred by QA from an observation and must be confirmed before it is treated as a requirement.

## 3. Scope

In scope: onboarding of dietary profile, menu generation, single-slot swap, shopping list scaling, consent for health data, household size validation.

Out of scope: payments and Pro plan, learning from cooked or discarded recipes, supermarket price integration, push notifications, recipe photo quality, performance under load.

## 4. Acceptance criteria

| ID | Criterion (Given / When / Then) | Source |
|---|---|---|
| AC-1 | Given a profile that declares one or more of the 14 EU allergens, when a weekly menu is generated, then none of the 21 recipes carries a declared allergen | FAQ "alergias"; `get_filtered_recipes` |
| AC-2 | Given one or more active diets (vegetariano, vegano, sin gluten, sin lactosa, sin huevo, keto, halal), when a menu is generated, then every recipe satisfies all active diets | FAQ "veganos o celíacos"; `get_filtered_recipes` |
| AC-3 | Given any valid profile, when a menu is generated, then it has one slot per day and meal type and no comida or cena repeats within the week. Observed: a menu generated on a Thursday had a recipe only from Thursday to Sunday (12 of 21 slots), while a menu for a future week had all 21. Confirmed by the PO on 2026-11-23: a menu created mid-week leaves the past days empty by design, weeks start on Monday, and the no-repeat rule applies to comida and cena only (breakfast repeating is normal) | Landing page; observed in data and in a local run |
| AC-4 | Given a generated menu for the current week, when the user replaces one recipe with "Añadir al menú" from the recipe library, then only that slot changes and the new recipe still satisfies AC-1 and AC-2 | Defined by the PO (option A); FAQ "cambiar recetas", whose promise of regenerating one slot is BUG-11; Free plan |
| AC-5 | Given a household of N people, when the shopping list is built, then it is grouped by aisle and quantities scale with N | Landing page; FAQ "familias numerosas" |
| AC-6 | Given a household, then adults are 1 to 10, children are 0 to 10 and the total number of people, which the app derives as adults plus children, is 1 to 10. The database does not force the sum; the app is the contract. Accepted by the PO | Database constraints; onboarding |
| AC-7 | Given a menu with pending slots, when the user adds an allergen to the profile, then the pending slots containing it are emptied and the user gets a notice. Confirmed by the PO | Inferred from database observation |
| AC-8 | Given a user, then allergies are stored only with consent and the user can export or delete them, and deleting the account removes them | FAQ "datos de salud"; consent and erasure tables; the onboarding blocks continuing until an explicit health-data consent is ticked |
| AC-9 | Given free text in the diet, dislike or cuisine fields, then the user is told it is not used for filtering. Verified for the diet field, where the onboarding says so. The onboarding offers no free-text field for allergens | Observed in the onboarding; the filter ignores the free-text fields |
| AC-10 | Given a user on the Free plan, then diet and allergy filters are available without upgrading | Pricing section |
| AC-11 | Given a weekly budget in the profile, when the estimated cost of the menu exceeds it, then the user is warned. The onboarding promises this | Onboarding text; the menu generator has a rule for it |

## 5. Personas and test data

Three test accounts, created by the project owner. Credentials are stored by variable name in `.env` and never written in documents.

| Persona | Profile to declare | Variable prefix | Why this profile |
|---|---|---|---|
| A. Couple with an allergy | 2 people (2 adults, 0 children); allergen `huevo` | `STAGING_ALERGIA_` | Egg is on 96 of the 658 active recipes, and a historical menu with an egg recipe for an egg-allergic profile was observed |
| B. Young vegan, lactose-free, saving money | 1 person; vegano and sin lactosa; weekly budget set | `STAGING_VEGANO_` | Stacked diets; the database forces vegano to imply vegetariano |
| C. Family of 4 reducing waste | 4 people (2 adults, 2 children); no allergen; goal "reducir desperdicio" | `STAGING_FAMILIA_` | Household scaling; the owner noted the goal may not change the menu |

Data rules: the database is shared by every environment, so tests write only through these three accounts. Database access is read-only. No test touches production.

## 6. Test design

| Technique | Applied to |
|---|---|
| Equivalence partitioning | Allergens: a recipe-tagged allergen, an untagged one, and `altramuces` (declarable but never tagged on a recipe) |
| Decision table | Allergen combinations x diet combinations, including a combination with no matching recipe |
| Boundary value analysis | Household: people 0, 1, 10, 11; adults 0, 1, equal to people, above people |
| State transition | Profile changed after a menu exists (AC-7) |
| Exploratory charters | Persona sessions in the UI, with menus compared across regenerations |

Cases are listed in `docs/test-cases.md`. Each case names the criterion it covers.

## 7. Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | A Cloudflare Turnstile challenge blocks automated login and guest mode (observed on `/login` and `/onboarding`) | High | High | Confirmed: both the login form and the Supabase Auth API require the captcha, so authenticated tests run against a local stack where it is off; staging is used only for public pages and read-only database checks |
| R2 | A menu contains an allergen the user declared (food safety) | Low | Critical | Cases TC-01, TC-02, TC-04; database cross-check after every generation |
| R3 | The database is shared across environments, so test data can mix with other users' data | Medium | Medium | Dedicated accounts only; read-only database session; no bulk writes |
| R4 | A profile changed after generation leaves unsafe pending slots (AC-7) | Medium | High | Case TC-10; raise to the PO |
| R5 | A user trusts free text to filter recipes (AC-9) | Low | High | The onboarding warns for the diet field; TC-13 checks the warning and that free text never changes the menu |
| R6 | Marketing promises are used as requirements and drift from real behaviour | Medium | Medium | Mark inferred criteria; confirm with the PO before reporting a bug |
| R7 | Planned UI changes to recipe cards would change locators mid-project | Low | Medium | Prefer role-based locators; do not depend on card markup |
| R8 | Only 7 profiles and 20 menus exist, so data findings have low statistical weight | High | Low | Present them as candidates to reproduce, not as defects |

## 8. Entry and exit criteria

Entry: the three accounts exist and each profile is declared on the local stack; the local app and its edge functions respond.

Exit: every priority 1 case executed; every candidate finding reproduced or discarded with evidence; open PO questions listed in the final report.

## 9. Open questions for the PO

1. Must adults plus children equal the number of people (AC-6)?
2. What should happen to pending menu slots when the user adds an allergen (AC-7)?
3. Is it intended that choosing a vegan diet also selects the allergens huevo, pescado and sulfitos? It happened in a local run without the user choosing them
4. The Story claims 21 distinct dishes. Does the no-repeat rule apply to desayuno as well, or only to comida and cena (AC-3)?
5. `altramuces` can be declared but no recipe is tagged with it. Is that intended?
6. A menu generated mid-week leaves the days already past empty. Is that intended, given the promise of 21 dishes from Monday to Sunday (AC-3)?

### PO answers of 2026-11-23

| Question | Answer | Effect on the tests |
|---|---|---|
| 1. Adults plus children equal the number of people (AC-6)? | "An adult eats more than a child"; QA's recommendation was accepted: AC-6 is adults 1 to 10, children 0 to 10 and a total of 1 to 10, derived by the app | Row 4 people, 1 adult, 0 children is accepted by the database and cannot be produced from the app, so it is not tested. The onboarding accepts a total above 10 and then fails (BUG-12, QAFRESCO-34). The product scales quantities per person without weighting children (improvement QAFRESCO-35), so TC-07 checks that quantities grow with the number of people |
| 2. Pending slots when an allergen is added (AC-7)? | Not clear to the PO, who accepted QA's recommendation | The product takes the conflicting open slots out, leaves them empty and adds a notice (`retire_conflicting_slots`, FRESCO-1151 and FRESCO-1157). That is the expected behaviour of TC-10, now automated |
| 3. Vegan diet selects huevo, pescado and sulfitos? | An implied allergen is fine when it contradicts the diet; otherwise it must be corrected. "This must be fixed" | `huevo` and `pescado` accepted; `sulfitos` is a defect (BUG-01, QAFRESCO-29) |
| 4. Does the no-repeat rule cover breakfast (AC-3)? | Only comida and cena; people usually eat almost the same breakfast | AC-3 and UI-TC-11 already check comida and cena only |
| 5. `altramuces` is declarable but no recipe carries it? | "We fix this" | BUG-10, QAFRESCO-32 |
| 6. Mid-week menu leaves past days empty (AC-3)? | Intended: weeks start on Monday and from the next Monday there are no gaps | BUG-04 is not a defect |

AC-4 is decided (option A): "swap one recipe" is the "Añadir al menú" flow, where the user picks the recipe that replaces the slot. The FAQ sentence about regenerating only that slot is registered as BUG-11 (QAFRESCO-33). Dragging two slots over each other and substituting an ingredient are separate flows and are not part of AC-4.
