# ATC CHK-B2-1: getFilteredRecipesExcludeDeclaredAllergens

| Field | Value |
|---|---|
| Component | `RecipesApi` |
| Type | API, Verification (positive control for `TC-15`; allergen safety without generation quota) |
| Source | Report B2, B3 |
| Fixture and role | `{ api }`; `alergia` and, through `api.asRole`, `vegano` |
| Endpoint | `POST /rest/v1/rpc/get_filtered_recipes` |
| Signature | `getFilteredRecipesExcludeDeclaredAllergens({ userId, allergens })` |
| Technique | EP valid, the allergens come from the persona's STORED profile |

Fixed assertions: the allergen list is non-empty (else the check would be vacuous); status 200; non-empty list; no recipe carries a declared allergen. Exact catalogue counts are never asserted.
Tag: none.
