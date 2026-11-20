# ATC CHK-B2-2: getFilteredRecipesMatchDeclaredDiet

| Field | Value |
|---|---|
| Component | `RecipesApi` |
| Type | API, Verification |
| Source | Report B2, B3 |
| Fixture and role | `{ api }`, role `vegano` |
| Endpoint | `POST /rest/v1/rpc/get_filtered_recipes` |
| Signature | `getFilteredRecipesMatchDeclaredDiet({ userId, diet })` |
| Technique | EP valid, diet flags come from the persona's STORED profile |

Fixed assertions: the diet list is non-empty; status 200; non-empty list; every recipe has each declared diet flag true.
Tag: none.
