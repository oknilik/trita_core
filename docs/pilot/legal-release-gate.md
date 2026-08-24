# Legal release gate

The repository currently contains draft/placeholder controller details. Code
must not invent or approve legal facts; the legal owner supplies and signs them.
`LEGAL_RELEASE_APPROVED=1` may be set in production only after this checklist is
complete and `LEGAL_DOCS_ARE_DRAFT` has been changed to `false` with approved
content.

- [ ] Controller legal name, address, registration/tax numbers and representative verified.
- [ ] Privacy notice, terms and DPA have version, effective date, owner and approval date.
- [ ] Retention, deletion, export and data-subject request procedure approved and tested.
- [ ] Subprocessor list covers Clerk, Neon, Vercel, Resend, Upstash and every enabled provider.
- [ ] Consent/legal links are visible before PII submission; accepted version and timestamp are retained.
- [ ] A test-user export and deletion request has an archived, redacted execution record.

Legal owner / approval date / document version: `____________________________`
