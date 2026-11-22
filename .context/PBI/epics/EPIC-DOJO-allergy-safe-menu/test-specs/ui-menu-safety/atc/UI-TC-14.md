# ATC UI-TC-14: saveDietAndAllergenFiltersOnFreePlan

| Field | Value |
|---|---|
| Component | `PreferencesPage` (`tests/components/ui/PreferencesPage.ts`) |
| Type | UI, Mutation |
| Source | TC-14, AC-10 |
| Fixture and persona | `{ test }`, `alergia`, API side `fixture.api.asRole('alergia')` |
| Route | `/profile` (plan observation), `/profile/preferences` (form) |
| Signature | `saveDietAndAllergenFiltersOnFreePlan(selection: { diet: string, allergen: string })`, two labels as shown on the chips (`Sin lactosa`, `Sésamo`) |
| Technique | EP valid partition (Free user edits filters); one diet and one allergen, no interacting conditions |
| Data | Modify: snapshot of the stored `alergenos` and 7 `dieta_*` flags via `api.profiles.getOwnProfile()`; chips chosen not to be locked and not set in the snapshot (failing `expect`). Cleanup: `finally` `api.profiles.restoreDietaryPreferences(snapshot)` |

Precondition steps (not ATC): login through the form; `ui.preferences.confirmFreePlan()` opens `/profile` and expects `pro_upsell_card` visible (Free plan observed, not assumed); `ui.preferences.goto()` opens `/profile/preferences`. The persona already consented to health data at onboarding, so no consent block is expected; if `health_consent_block` shows, the save button stays disabled and the ATC fails with that reason.

Fixed assertions (inside the ATC):
- the chip `preferencia_dieta_option` with text `Sin lactosa` is enabled, click turns `aria-pressed` to true
- the chip `preferencia_alergeno_option` with text `Sésamo` is enabled, click turns `aria-pressed` to true
- `actualizar_preferencias_button` enabled, click, then `preferencias_saved_message` visible
- `pro_checkout_dialog` is not visible (no upgrade wall interrupted the flow)

Test-level assertions:
- after `page.reload()` of `/profile/preferences` both chips keep `aria-pressed` true (persisted)
- API readback: `dieta_sin_lactosa` is true and `alergenos` contains `sesamo`
- after the `finally` restore, stored values equal the snapshot (no leftover)

Quota: none. Not covered: a Pro user, the allergen lock rules (vegano, vegetariano, sin gluten), the exact wording of a paywall (none known, risk R6).
