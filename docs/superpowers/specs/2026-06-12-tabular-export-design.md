# Tabular Applications Export (XLSX / CSV / PDF) — Design

Date: 2026-06-12
Status: Approved in brainstorming session with WlanKabL

## Purpose

Export applications as human- and authority-readable tables. Primary use case: proof of
job-search efforts ("Nachweis der Eigenbemühungen") for the Agentur für Arbeit. Secondary
use case: a complete personal overview of all applications.

No Google integration. An XLSX file dropped into Google Drive converts to a Google Sheet
with colors intact, which covers the "transfer to Google" need with zero setup.

## User flow

1. The applications list page gets an "Exportieren" button that opens an export modal.
2. Modal fields:
   - **Preset:** `afa` ("Agentur für Arbeit") or `full` ("Komplett")
   - **Format:** `xlsx`, `csv`, or `pdf` (radio selection)
   - **Date range:** optional `from` / `to`. Empty means everything.
   - **Include archived:** checkbox, visible for the `full` preset only.
3. Submit triggers a plain browser download via the GET route (link navigation with query
   params, no blob handling). The modal closes and a toast confirms the export started.
4. `settings.lastExportAt` is updated server-side (via the settings repository) on
   successful export. Note: the field exists in the settings schema today but is never
   written anywhere. As a targeted cleanup, the existing JSON export route gets the same
   one-line update so the field becomes truthful.

Preset semantics:

- **afa:** only applications with `appliedAt` set (saved-only entries are not a
  job-search effort). Date range filters on `appliedAt`. Archived applications are
  **always included**: an archived rejection still counts as an effort.
- **full:** all applications. Date range filters on `appliedAt ?? createdAt`. Archived
  entries excluded unless the checkbox is set.

## API

```
GET /api/export/applications?format=xlsx|csv|pdf&preset=afa|full&from=<ISO>&to=<ISO>&includeArchived=<bool>
```

- Query validated with a new `tabularExportQuerySchema` in `packages/shared`.
- Invalid query or `from > to` → 400 via `createError`.
- Response: file buffer with correct `Content-Type` and `Content-Disposition`.

Filenames:

- afa with range: `eigenbemuehungen-<from>_<to>.<ext>`
- afa without range: `eigenbemuehungen-<exportDate>.<ext>`
- full: `bewerbungen-export-<exportDate>.<ext>`

## Server architecture

```
apps/web/server/utils/export/
  rows.ts      pure row builder: filter, sort, company join, date formatting
  labels.ts    AfA-specific status/source wording (deliberately distinct from UI labels)
  xlsx.ts      exceljs renderer
  csv.ts       CSV renderer (semicolon, UTF-8 BOM, CRLF)
  pdf.ts       pdfmake renderer
apps/web/server/api/export/applications.get.ts
```

`rows.ts` is the single place with logic. It produces a format-agnostic structure:
document header metadata (title, export date, range, entry count, optional applicant
line), column definitions, and rows (each cell typed, status cells carrying the status
key for coloring). The three renderers consume this structure, which guarantees
identical content across formats. Rows are sorted chronologically ascending by
`appliedAt` (afa) or `appliedAt ?? createdAt` (full). Dates render as `DD.MM.YYYY`.
Company data joins via `companyId`; location falls back from `application.location` to
`company.location`.

Routes keep using repositories; no direct file access.

## Presets and columns

**afa:**

| Nr. | Datum der Bewerbung | Unternehmen | Ort | Stelle | Bewerbungsweg | Stand/Ergebnis |
| --- | ------------------- | ----------- | --- | ------ | ------------- | -------------- |

**full:** the afa columns plus Arbeitsmodell, Gehalt (formatted range + period),
Tech-Stack (comma-separated), Rating, Quelle-URL, Erstellt am, Follow-up am, Archiviert.

AfA status wording (in `labels.ts`, not the UI labels):

| Status    | Export wording        |
| --------- | --------------------- |
| applied   | Beworben              |
| phone     | Telefoninterview      |
| interview | Vorstellungsgespräch  |
| offer     | Angebot erhalten      |
| rejected  | Absage erhalten       |
| withdrawn | Zurückgezogen         |
| ghosted   | Keine Rückmeldung     |
| saved     | (never appears)       |

AfA source wording: "Online über LinkedIn", "Initiativbewerbung", "Online über
Unternehmensseite", "Online über Indeed", "Online über StepStone", "Online über Xing",
"Sonstige".

The full preset uses the regular German UI labels from shared (see label refactor).

## Document header

Every export carries a header block: title ("Nachweis der Eigenbemühungen" for afa,
"Bewerbungsübersicht" for full), export date, date range (when set), and entry count.
When the new settings fields are filled, an applicant line is added (name and
BA-Kundennummer).

## Colors (XLSX + PDF)

The status **cell** (not the whole row) gets a subtle background fill with dark text:

- offer → green, interview → blue, phone → light blue, applied → neutral gray-blue
- rejected → red, withdrawn → orange, ghosted → dark gray, saved → light gray (full only)

Exact hex values are picked at implementation time, aligned with the existing status
badge colors in the UI. XLSX additionally gets a frozen header row, AutoFilter, and
fixed column widths. CSV has no formatting by nature.

## Shared label refactor

The enum label maps (status, source, workMode) move from `apps/web/app/i18n/de.ts` to
`packages/shared/src/labels/de.ts`. `app/i18n/de.ts` re-exports them so all UI call
sites stay unchanged. The server imports them from `@job-tracker/shared`. Run
`pnpm build:shared` after the move.

## Settings add-on

Two optional fields in the settings schema: `applicantName` and `baCustomerNumber`
(both trimmed strings). Two inputs on the settings page. Empty values simply omit the
applicant line in export headers.

## Edge cases

- Date range with zero matches: still a valid document with header and a "Keine
  Einträge im Zeitraum" notice row. Not an error.
- Missing `appliedAt` in the full preset: empty cell, no fake date.
- Invalid query / `from > to`: 400 via `createError`.
- 100+ applications: synchronous buffer generation is fine at this scale.

## Dependencies

`exceljs` and `pdfmake` (plus types if needed) in `apps/web`. Both are pure JS and run
in Nitro. pdfmake ships Roboto fonts for server-side use; if Nitro asset bundling of the
fonts misbehaves, the fallback is `pdf-lib` with a manual table layout. pdfmake is tried
first.

## Verification

No test runner exists in the repo. `rows.ts` is kept pure so tests can be added later.
Manual verification: download all three formats; open the XLSX in Excel (colors, filter,
umlauts), the CSV in Excel (umlauts, separator), visual check of the PDF; click through
the modal flow with Playwright MCP.

## Out of scope

Google Sheets/Docs API integration, automatic uploads, e-mail delivery, English export
labels, scheduled/automatic exports.
