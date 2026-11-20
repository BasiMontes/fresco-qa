# UI testing session

| Field | Value |
|---|---|
| Date | 2026-11-19 |
| Tool | `playwright-cli` (the repository's only browser path; no browser MCP) |
| Environments | Staging `https://fresco-pre.vercel.app/` for public pages. A local stack of the product for every authenticated flow |
| Personas | A (`ALERGIA`), B (`VEGANO`), C (`FAMILIA`), defined in `docs/feature-test-plan.md` |
| Charter | Explore signup, onboarding and menu generation as three personas, and check that menus respect each profile |

## 1. Why two environments

Staging cannot be driven by an automated browser past the login:

- The login form shows a Cloudflare Turnstile widget. With the form filled and the button pressed, the page stays on `/login` and says *"Espera a que termine la verificación de arriba para continuar"* (screenshot 3). The token field stayed empty for about 25 seconds.
- The Supabase Auth API behind it also demands a captcha: a password login with the public key returned `captcha_failed` before checking the password. An API-minted session is not possible either.
- The captcha protection of the database project is shared by every environment, so it cannot be switched off for staging alone.

The captcha checkbox visible in screenshot 3 was never clicked, so a human-assisted login on staging remains an untested option.

Authenticated flows therefore ran against a local copy of the product: local Supabase (database, auth, edge functions) and the web app. The app turns the widget off when its public site key is empty, so it was started with that variable empty. Nothing in the product repository was modified. The three accounts were created through the real signup form, not through an admin API, which the repository's browser doctrine forbids in any environment.

## 2. Session log

| # | Action | Result |
|---|---|---|
| 1 | Open the staging landing page and the FAQ, anonymous | Public contract read; no data created (screenshots 1 and 2) |
| 2 | Try the staging login with dummy values | Blocked by the captcha (screenshot 3) |
| 3 | Try the staging guest mode, which would write to the shared database | Button stays disabled with both consents ticked; not pursued |
| 4 | Sign up persona A on the local app, complete the 3-step onboarding, generate the menu | Account created; profile `huevo`, 2 adults; menu generated |
| 5 | Same for persona B (vegano, sin lactosa, objective save money, budget 35 EUR, 1 adult) | Menu generated |
| 6 | Same for persona C (2 adults, 2 children, objective reduce waste) | Menu generated |
| 7 | Cross-check each profile and menu in the local database, read-only | Section 4 |
| 8 | Log in again as each persona, dismiss the tour and capture the menu | Screenshots 4 to 6 |

Every browser session had a name and was closed; `playwright-cli list` showed none left.

## 3. Screenshots

| # | File | Shows |
|---|---|---|
| 1 | [Landing page](screenshots/ui/01-landing-fresco-pre.png) | Public promise of the product on staging |
| 2 | [FAQ on allergies](screenshots/ui/02-faq-alergias-fresco-pre.png) | "Excluimos de tus menús las recetas que contienen los alérgenos que declares" |
| 3 | [Login blocked](screenshots/ui/03-login-captcha-bloqueado-fresco-pre.png) | Cloudflare widget and the waiting message. Dummy credentials, not a real account |
| 4 | [Menu, persona A](screenshots/ui/04-local-alergia-menu.png) | 562 available recipes, estimated weekly cost 93.12 EUR, the three meals of the day |
| 5 | [Menu, persona B](screenshots/ui/05-local-vegano-menu.png) | 267 available recipes, estimated weekly cost 94.95 EUR |
| 6 | [Menu, persona C](screenshots/ui/06-local-familia-menu.png) | 658 available recipes, estimated weekly cost 134.79 EUR |

## 4. Results

The numbers below come from a read-only query on the local database after each run.

| Check | A (`huevo`) | B (vegano, sin lactosa) | C (family) |
|---|---|---|---|
| Profile stored | `huevo`, 2 adults | vegetariano, vegano, sin lactosa; budget 35 EUR | no diet or allergen; 2 adults, 2 children |
| Recipes available, shown in the UI | 562 | 267 | 658 |
| Same count computed with the filter rules in SQL | 562 | 267 | 658 |
| Slots with a recipe | 12 of 21 | 12 of 21 | 12 of 21 |
| Recipes in the menu carrying a declared allergen | 0 | 0 | 0 |
| Recipes in the menu violating a diet | 0 | 0 | 0 |
| Repeated comida or cena | 0 | 0 | 0 |

The UI count matching an independent computation of the same rules supports that the filter behaves as the function reads. Each persona had one run, so this is indicative and not a pass of the cases.

## 5. Findings

None is confirmed as a defect: the criteria are derived by QA and the open questions are with the PO. Each has a case in `docs/test-cases.md`.

| ID | Type | Finding | Screenshots | Case |
|---|---|---|---|---|
| U-01 | Testability risk | Login and guest mode on staging cannot be completed by an automated browser | Screenshot 3 | Plan risk R1 |
| U-02 | Candidate | Choosing the diets vegano and sin lactosa stored the allergens `pescado`, `sulfitos` and `huevo` that the test did not select, and the diet step showed them as selected. Whether the summary shows them was not checked | Stored profile of persona B | TC-16 |
| U-03 | Candidate | A menu generated on a Thursday had a recipe only from Thursday to Sunday (12 of 21 slots), against the promise of 21 dishes from Monday to Sunday | Slot counts of all three menus. A menu for a future week had 21 of 21 slots in the API session | TC-11 |
| U-04 | Candidate | Persona B set a weekly budget of 35 EUR and the menu shows an estimated 94.95 EUR. No warning was displayed and the stored warnings were empty, although the onboarding promises a warning when the menu exceeds the budget and the menu generator has a rule for it. Two different cost calculations may explain it | Screenshot 5 and the stored menu | TC-17 |
| U-05 | Candidate | In the menu of persona A, "Ensalada de kale con manzana" shows a photo with halved boiled eggs. The recipe lists kale, apple and walnuts, and its allergen is `frutos_de_cascara`, not egg. The image is an external stock photo. For a user with an egg allergy the photo contradicts the data | Screenshot 4 | TC-18 |
| U-06 | Observation | Every recipe card shows a single diet tag. In the menu of a vegan user the tags read "Vegetariano", so the screen never confirms "vegano" | Screenshot 5 | TC-03 |
| U-07 | Verified | The onboarding requires an explicit health-data consent before continuing past the diet and allergen step | Onboarding run | AC-8 |
| U-08 | Verified | The onboarding says that the free-text diet field is not used to filter, and offers no free-text field for allergens | Onboarding run | TC-13 |

## 6. Not covered

- Staging flows after login, and a human-assisted login.
- Shopping list content and its quantities, slot swap, profile edits after generation, account deletion and export.
- Any browser other than the default headless one, and mobile layouts.
- Repeated generations of the same profile: each persona was generated once.
- Whether the tag and photo observations (U-05, U-06) follow a rule of the product that is not visible from outside.

## 7. How to repeat the local setup

1. Start Docker and the local Supabase stack of the product, which already holds the migrations and the recipe catalogue.
2. Serve the product's edge functions, which generate menus and shopping lists.
3. Start the web app with its public captcha site key set to an empty value and the local stack settings loaded.
4. Create each persona through the signup form with the credentials stored by variable name in `.env` as `STAGING_<ROLE>_EMAIL` and `STAGING_<ROLE>_PASSWORD`, and declare the profile from the plan.
5. Read-only database queries confirm the stored profile and the menu.
