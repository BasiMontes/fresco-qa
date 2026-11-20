# ATC CHK-U1-3: callEdgeFunctionWithoutSessionIsDenied

| Field | Value |
|---|---|
| Component | `AccessControlApi` |
| Type | API, Negative |
| Fixture and role | `{ api }`, token cleared |
| Signature | `callEdgeFunctionWithoutSessionIsDenied(functionName: EdgeFunctionName)` |
| Technique | EP invalid: no credential; 2 functions (`generate-meal-plan`, `delete-account`), same outcome |

Fixed assertions: status 401; error text is `No autorizado`. `delete-account` is called only without any token, never with a session.
Control: `CHK-U4`. Tag: none.
