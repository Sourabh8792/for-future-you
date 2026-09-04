# Tests

| Test Name | Covers | Status |
|---|---|---|
| Project documentation exists | README, project details, card copy, and test register | Passed |
| Approved card copy preserved | Exact approved front and back wording | Passed |
| Website letter preserved | Final approved letter exists in the private local source and encrypted payloads | Passed |
| Private gate structure | Three approved roles, parent questions, nephew helper flow, and small back link | Passed |
| Private-content boundary | Letter, Twitter handle, and Notion link are absent from the public page shell | Passed |
| Encryption round trip | Argon2id plus AES-256-GCM decrypts a disposable test and rejects a wrong answer | Passed |
| Reload locking | No browser persistence API retains the answer, key, or decrypted letter | Passed |
| Mobile website structure | Responsive viewport, narrow reading column, mobile breakpoint, and touch target | Passed |
| Mobile visual QA | Rendered appearance and overflow on a phone-sized viewport | Pending browser approval |
| Permanent-content fallback | Private encrypted website can be restored from the project and private backups | Pending backup |
| Notion form link | Notion URL is included only inside the encrypted letter | Passed |
| Notion form notification | Submission delivery and duplicate-alert handling | Not tested |
| Print PDF structure | Two A6 portrait pages with 3 mm bleed | Passed |
| QR destination | Rendered QR decodes to the production HTTPS URL | Passed |
| Printed QR proof | QR scans from the final physical size and material | Not started |
