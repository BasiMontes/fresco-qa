# ATC CHK-U4: listCatalogWithoutSession

| Field | Value |
|---|---|
| Component | `RecipesApi` |
| Type | API, Verification (control for `CHK-U1` and `CHK-C1`) |
| Source | Report section 3, "Read the recipes catalogue: allowed, 200" |
| Fixture and role | `{ api }`, token cleared with `api.clearAuthToken()` |
| Endpoint | `GET /rest/v1/recipes` with the public `apikey` header only |
| Signature | `listCatalogWithoutSession()` |
| Technique | EP valid: anonymous reader on a public resource |

Fixed assertions: status 200; non-empty array.
Why it exists: if the `apikey` header were missing or wrong, every 401 in `CHK-U1` and `CHK-C1` would pass for the wrong reason. This ATC runs first in its file and proves the key works while no session is sent.
Not asserted: the inactive recipes (`activo=false`) readable anonymously, because API-01 is a question for the PO, not a rule.
