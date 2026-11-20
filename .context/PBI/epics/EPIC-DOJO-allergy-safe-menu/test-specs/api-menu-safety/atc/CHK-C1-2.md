# ATC CHK-C1-2: callEdgeFunctionWithTamperedTokenIsDenied

| Field | Value |
|---|---|
| Component | `AccessControlApi` |
| Type | API, Negative |
| Fixture and role | `{ api }`, role `alergia`; token tampered for the call only |
| Signature | `callEdgeFunctionWithTamperedTokenIsDenied()` |
| Technique | EP invalid: broken signature, edge function surface |

Fixed assertions: status 401; message `Invalid JWT`. The request body is invalid on purpose so a wrongly accepted call cannot create a menu. `delete-account` is excluded.
Controls: `CHK-A1` and `CHK-U4`. Tag: none.
