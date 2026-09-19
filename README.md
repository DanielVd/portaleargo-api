# PortaleArgo API

[![Latest Release](https://img.shields.io/github/v/release/DanielVd/portaleargo-api)](https://github.com/DanielVd/portaleargo-api/releases/latest)

TypeScript client for Portale Argo, with first-class support for the official Famiglia API.

**Current GitHub release:** [v1.1.0](https://github.com/DanielVd/portaleargo-api/releases/tag/v1.1.0) (2026-09-19). See [CHANGELOG.md](CHANGELOG.md) for the release history and [portaleargo-mcp v0.2.0](https://github.com/DanielVd/portaleargo-mcp/releases/tag/v0.2.0) for the MCP server built on this client.

This repository's GitHub release is **not an npm publication**. Use the tagged source checkout below to install this version.

## Requirements

- Node.js 20.18.1+
- an Argo Famiglia account
- school code, username, and password

## Installation

Clone the tagged GitHub release and build it with Node.js 20.18.1+:

```bash
git clone --branch v1.1.0 --depth 1 https://github.com/DanielVd/portaleargo-api.git
cd portaleargo-api
npm ci --legacy-peer-deps --ignore-scripts
npm run build
```

Use `./dist/index.js` from this checkout when running the code locally. The `portaleargo-api` import shown below is for a consuming project that has installed this library as a dependency; it is not a claim that this GitHub release is available on npm.

Keep credentials in environment variables. Do not commit a `.env` file or include credentials in diagnostic output.

## Quick start

For the tagged source checkout above:

```ts
import { Client } from "./dist/index.js";

const client = new Client({
  schoolCode: process.env.ARGO_SCHOOL_CODE!,
  username: process.env.ARGO_USERNAME!,
  password: process.env.ARGO_PASSWORD!,
  dataProvider: null,
});

await client.bootstrapSession();

const profile = await client.getProfilo();
const schedule = await client.getOrarioGiornaliero();
const notices = await client.getStoricoBacheca(profile.scheda.pk);
```

`bootstrapSession()` obtains or refreshes the OAuth token when needed and opens the Famiglia application session. Famiglia methods can therefore initialize themselves without requiring the legacy dashboard/login orchestration first.

## Famiglia API coverage

The client uses the official Famiglia backend at:

```text
https://didattica.portaleargo.it/famiglia/api
```

Read-only methods migrated and validated against the real service include:

- profile and profile details
- dashboard
- daily timetable
- generic notice-board history
- student document history
- generic and student attachment download
- curriculum
- taxes
- telematic payment receipts
- teacher meetings
- recovery courses
- scrutiny grades

Response types are based on structures observed from the real Famiglia API. Collections that could not be observed populated are intentionally kept generic rather than documented with speculative DTOs.

## Mutations

The following state-changing operations use the official Famiglia API contracts used by the Famiglia web application:

```ts
await client.confirmPresaVisioneBacheca(pkScheda, prgMessaggio);
await client.confirmPresaVisioneBachecaAlunno(prgMessaggio);
await client.togglePresaAdesioneBacheca(pkScheda, prgMessaggio);
await client.confirmPresaVisioneNota(pkNota);
await client.giustificaEventi(eventIds, "2026-09-18", "Motivazione");
```

These calls modify real school data in Argo and should only be executed deliberately. Generic bulletin and student-document read confirmation were validated against the real Famiglia backend. Bulletin adhesion, disciplinary-note read confirmation and attendance justification are implemented using the observed Famiglia request contracts but **have not been validated end-to-end on applicable real records**. Do not treat their presence in the client as proof of a successful production mutation.

`togglePresaAdesioneBacheca()` is a toggle: invoking it again can undo a previously confirmed adhesion.

`confirmPresaVisioneBacheca()` downloads an attachment before confirming read status because the Famiglia backend requires an attachment download for the validated notice type. Callers may provide `allegatoUid`; when omitted, the client finds the notice and downloads its first attachment. If no attachment exists, the method fails explicitly instead of sending an unsupported confirmation request.

## PCTO

`getPCTOData()` deliberately remains on the compatible legacy endpoint for now.

The official Famiglia endpoint `POST /famiglia/pcto` exists, but the account used for migration testing returns HTTP 403 because PCTO visibility is not enabled by that school. Keeping the existing implementation preserves support for schools where the legacy call works, without inventing an unverified Famiglia response schema.

## Authentication compatibility

The Famiglia session, profile, and dashboard state are separate from the historical client state.

The public Famiglia methods use the new session path, while the existing `login()` / refresh / logout compatibility lifecycle still retains some legacy internal calls. This is intentional to avoid breaking existing consumers that depend on the historical `login()` return shape and dashboard behavior.

New code should prefer:

```ts
await client.bootstrapSession();
const profile = await client.getProfilo();
```

rather than depending on the legacy dashboard bootstrap when it is not needed.

## Attachments

Attachment helpers return authenticated signed URLs and can download the file directly:

```ts
const response = await client.downloadAllegato(uid);
const bytes = await response.arrayBuffer();
```

Student-specific documents use `getLinkAllegatoStudente()` / `downloadAllegatoStudente()`.

## Validation

On pull requests to `main`, the `CI / static-checks` job performs installation, a production dependency audit (`npm audit --omit=dev --audit-level=high`), ESLint, TypeScript checking, E2E script syntax checking, and a build. This job is required by the `main` branch ruleset. CodeQL also runs on pull requests and on pushes to `main`.

After a successful push to `main`, the `famiglia-readonly-e2e` job runs the read-only Famiglia integration script with the repository secrets:

```text
ARGO_SCHOOL_CODE
ARGO_USERNAME
ARGO_PASSWORD
```

The automated read-only E2E does not execute state-changing operations. Generic and student-document read confirmation were additionally checked against the real backend before v1.1.0, but no automatic API CI job runs live mutations. See the [v1.1.0 release notes](https://github.com/DanielVd/portaleargo-api/releases/tag/v1.1.0) for the exact release scope.

The current branch README may contain documentation updates made after the release. The `v1.1.0` tag and its release source remain unchanged.

## Development

Keep the Famiglia API as the canonical implementation source. Do not add browser scraping, private endpoints, or guessed Argo contracts when an official endpoint or observable frontend contract is available.

For response structures that cannot be verified, prefer a conservative generic type and refine it after observing a real response.
