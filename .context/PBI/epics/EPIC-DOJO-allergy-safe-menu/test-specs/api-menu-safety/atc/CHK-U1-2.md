# ATC CHK-U1-2: callFilterRpcWithoutSessionIsDenied

| Field | Value |
|---|---|
| Component | `AccessControlApi` |
| Type | API, Negative |
| Fixture and role | `{ api }`, token cleared |
| Signature | `callFilterRpcWithoutSessionIsDenied()` |
| Technique | EP invalid: no credential, RPC surface |

Fixed assertions: status 401; code `42501`; message matches `/permission denied for function/i`.
Control: `CHK-U4`. Tag: none.
