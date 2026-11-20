# ATC CHK-C1-1: readPrivateTableWithTamperedTokenIsDenied

| Field | Value |
|---|---|
| Component | `AccessControlApi` |
| Type | API, Negative |
| Fixture and role | `{ api }`, role `alergia`; the ATC tampers the token for the call and restores it |
| Signature | `readPrivateTableWithTamperedTokenIsDenied()` |
| Technique | EP invalid: well-formed token with a broken signature, REST surface |

Fixed assertions: status 401; the body is not a rows array.
Controls: `CHK-A1` and `CHK-U4`. The original token is never written anywhere. Tag: none.
