# Changelog

## 1.1.0 - 2026-09-19

### Added

- First-class support for the official Argo Famiglia API across profile, dashboard, timetable, notice board, student documents, curriculum, taxes, receipts, meetings, recovery courses, and scrutiny data.
- Famiglia mutation methods for generic bulletin read confirmation, student-document read confirmation, bulletin adhesion, disciplinary-note read confirmation, and attendance justification.
- Read-only Famiglia end-to-end validation in CI.
- Production dependency audit gate for high-severity runtime advisories.

### Changed

- Node.js runtime requirement is now 20.18.1 or newer.
- Generic bulletin read confirmation now downloads an attachment before confirming read status, matching the real Famiglia backend requirement.
- Upstream dependency updates have been synchronized while preserving fork history.

### Compatibility

- Existing legacy authentication lifecycle behavior remains available for compatibility.
- `getPCTOData()` remains on the compatible legacy path because the Famiglia PCTO endpoint is permission-dependent and returns HTTP 403 for the validation account.

### Validation

- Real Famiglia read-only E2E: passed.
- Generic bulletin read confirmation against the real backend: passed.
- Student-document read confirmation against the real backend: passed.
- CI static checks and CodeQL are required before release.
