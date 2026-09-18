# PortaleArgo API

[![Latest Release](https://img.shields.io/github/v/release/DanielVd/portaleargo-api)](https://github.com/DanielVd/portaleargo-api/releases/latest)

TypeScript client for Portale Argo, with first-class support for the official Famiglia API.

## Requirements

- Node.js 20.18.1+
- an Argo Famiglia account
- school code, username, and password

## Installation

```bash
npm install
npm run build
```

## Quick start

```ts
import { Client } from "portaleargo-api";

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

These calls modify data in Argo and should only be executed deliberately.

`confirmPresaVisioneBacheca()` downloads an attachment before confirming read status because the Famiglia backend can require at least one attachment download. Callers may provide `allegatoUid`; when it is omitted, the client resolves and downloads the first attachment of the notice automatically.

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

The repository CI runs:

```bash
npx eslint src --max-warnings=0
npx tsc --noEmit
node --check scripts/e2e-readonly.mjs
npm run build
```

A separate read-only E2E workflow validates the migrated methods against Argo using repository secrets:

```text
ARGO_SCHOOL_CODE
ARGO_USERNAME
ARGO_PASSWORD
```

The automated E2E does not execute state-changing operations.

## Development

Keep the Famiglia API as the canonical implementation source. Do not add browser scraping, private endpoints, or guessed Argo contracts when an official endpoint or observable frontend contract is available.

For response structures that cannot be verified, prefer a conservative generic type and refine it after observing a real response.
