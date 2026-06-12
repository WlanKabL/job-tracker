# Tabular Applications Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export applications as XLSX (colored), CSV, or PDF with an "Agentur für Arbeit" preset and a full preset, triggered from a modal on the applications list page.

**Architecture:** One Nitro route (`GET /api/export/applications`) validates the query via a shared Zod schema, loads data through repositories, feeds a pure row builder, and dispatches to one of three renderers (exceljs, hand-rolled CSV, pdfmake). German enum labels move to `packages/shared` so both app and server use them. Two new settings fields put the applicant's name and BA-Kundennummer into the document header.

**Tech Stack:** Nuxt 4 / Nitro, Zod, exceljs, pdfmake (server-side with PDF standard fonts), pnpm workspaces.

**Context:** Spec at `docs/superpowers/specs/2026-06-12-tabular-export-design.md`. GitHub issue #1. Branch `feat/applications-export`. No test runner exists in this repo, so verification per task is `pnpm types:check` + `pnpm lint` + manual endpoint checks at the end; the row builder is a pure function so unit tests can be added later.

**Conventions that apply everywhere:** TypeScript strict, no `any`, named exports, `async/await` only, all UI strings via `apps/web/app/i18n/de.ts`, routes never touch files directly, errors via the helpers in `apps/web/server/utils/errors.ts`. After every change in `packages/shared`, run `pnpm build:shared` before type-checking consumers.

---

### Task 1: Shared package: German enum labels, export schema, settings fields

**Files:**
- Create: `packages/shared/src/labels/de.ts`
- Create: `packages/shared/src/schemas/export.ts`
- Modify: `packages/shared/src/schemas/settings.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create the German enum label maps**

Create `packages/shared/src/labels/de.ts`:

```ts
import type { ApplicationSource, ApplicationStatus, WorkMode } from "../enums.js";

/**
 * German display labels for shared enums. Single source of truth for app UI
 * (re-exported via apps/web/app/i18n/de.ts) and server-side exports.
 */
export const STATUS_LABELS_DE: Record<ApplicationStatus, string> = {
    saved: "Vorgemerkt",
    applied: "Beworben",
    phone: "Telefon-Screening",
    interview: "Interview",
    offer: "Angebot",
    rejected: "Abgesagt",
    withdrawn: "Zurückgezogen",
    ghosted: "Geghostet",
};

export const SOURCE_LABELS_DE: Record<ApplicationSource, string> = {
    linkedin: "LinkedIn",
    initiativ: "Initiativ",
    company_website: "Unternehmensseite",
    indeed: "Indeed",
    stepstone: "StepStone",
    xing: "Xing",
    other: "Sonstige",
};

export const WORK_MODE_LABELS_DE: Record<WorkMode, string> = {
    remote: "Remote",
    hybrid: "Hybrid",
    on_site: "Vor Ort",
};
```

The values are copied verbatim from `apps/web/app/i18n/de.ts` (`t.status`, `t.source`, `t.workMode`). They must stay identical so the UI does not change.

- [ ] **Step 2: Create the export query schema**

Create `packages/shared/src/schemas/export.ts`:

```ts
import { z } from "zod";
import { isoDateSchema } from "./common.js";

export const EXPORT_FORMAT = ["xlsx", "csv", "pdf"] as const;
export type ExportFormat = (typeof EXPORT_FORMAT)[number];

export const EXPORT_PRESET = ["afa", "full"] as const;
export type ExportPreset = (typeof EXPORT_PRESET)[number];

export const tabularExportQuerySchema = z
    .object({
        format: z.enum(EXPORT_FORMAT),
        preset: z.enum(EXPORT_PRESET),
        from: isoDateSchema.optional(),
        to: isoDateSchema.optional(),
        includeArchived: z
            .union([z.string(), z.boolean()])
            .optional()
            .transform((v) => v === true || v === "true" || v === "1"),
    })
    .refine((q) => !q.from || !q.to || Date.parse(q.from) <= Date.parse(q.to), {
        message: "from must not be after to",
        path: ["from"],
    });

export type TabularExportQuery = z.infer<typeof tabularExportQuerySchema>;
```

The `includeArchived` union-transform mirrors the existing pattern in `apps/web/server/api/applications/index.get.ts:31-34` (query params arrive as strings).

- [ ] **Step 3: Add applicant fields to the settings schema**

In `packages/shared/src/schemas/settings.ts`, add two fields to `settingsSchema` after `weeklyGoal`:

```ts
    /** Applicant identity rendered in export document headers. Empty string = not set. */
    applicantName: z.string().trim().max(200).default(""),
    baCustomerNumber: z.string().trim().max(50).default(""),
```

Empty string (not `undefined`) is the "not set" value on purpose: `settingsRepo.update` strips `undefined` from patches, so an optional field could never be cleared. `settingsUpdateSchema` is a `.partial()` of this schema and picks the fields up automatically. Existing `settings.json` files get the defaults applied by `withDefaults` in the repo at read time.

- [ ] **Step 4: Export the new modules from the package index**

In `packages/shared/src/index.ts`, add after the schema exports:

```ts
export * from "./schemas/export.js";
export * from "./labels/de.js";
```

- [ ] **Step 5: Build shared and type-check**

Run: `pnpm build:shared`
Expected: tsc completes without errors.

Run: `pnpm types:check`
Expected: PASS (no consumers changed yet).

- [ ] **Step 6: Commit**

```powershell
git add packages/shared
git commit -m "feat(shared): add German enum labels, tabular export schema, applicant settings fields"
```

---

### Task 2: Re-export shared labels in the app i18n + add new UI strings

**Files:**
- Modify: `apps/web/app/i18n/de.ts`

- [ ] **Step 1: Replace the inline label maps with shared imports**

At the top of `apps/web/app/i18n/de.ts`, add the import:

```ts
import { SOURCE_LABELS_DE, STATUS_LABELS_DE, WORK_MODE_LABELS_DE } from "@job-tracker/shared";
```

Replace the three inline objects (`status: { saved: "Vorgemerkt", ... }`, `source: { ... }`, `workMode: { ... }` at lines 57-84) with:

```ts
    status: STATUS_LABELS_DE,
    source: SOURCE_LABELS_DE,
    workMode: WORK_MODE_LABELS_DE,
```

Nothing else in the file changes in this step. Consumers (`useStatusMeta.ts`, components) keep reading `t.status.saved` etc. The keys are identical; only the values' types widen from literals to `string`, which no consumer depends on.

- [ ] **Step 2: Add export modal strings**

Inside the `applications` section of `t` (after `kanban: { ... }`), add:

```ts
        export: {
            button: "Exportieren",
            title: "Bewerbungen exportieren",
            preset: "Vorlage",
            presetAfa: "Agentur für Arbeit",
            presetFull: "Komplett",
            presetAfaHint: "Nur tatsächlich beworbene Einträge, behördentaugliche Formulierungen, Archivierte inklusive.",
            presetFullHint: "Alle Felder. Archivierte optional.",
            format: "Format",
            formatXlsx: "Excel (XLSX)",
            formatCsv: "CSV",
            formatPdf: "PDF",
            from: "Von",
            to: "Bis",
            rangeHint: "Leer lassen für den gesamten Zeitraum.",
            includeArchived: "Archivierte einbeziehen",
            submit: "Exportieren",
            started: "Export gestartet.",
            invalidRange: "Das Von-Datum muss vor dem Bis-Datum liegen.",
        },
```

- [ ] **Step 3: Add settings strings**

Inside the `settings` section of `t` (after `backupsHint`), add:

```ts
        applicant: "Bewerberdaten für Exporte",
        applicantHint: "Erscheinen im Kopf der Export-Dokumente, z.B. im Nachweis für die Agentur für Arbeit.",
        applicantName: "Name",
        baCustomerNumber: "BA-Kundennummer",
```

- [ ] **Step 4: Type-check and lint**

Run: `pnpm types:check`
Expected: PASS.

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add apps/web/app/i18n/de.ts
git commit -m "refactor(i18n): source enum labels from shared, add export and applicant strings"
```

---

### Task 3: Server: AfA labels and the pure row builder

**Files:**
- Create: `apps/web/server/utils/export/labels.ts`
- Create: `apps/web/server/utils/export/rows.ts`

- [ ] **Step 1: Create the AfA wording maps**

Create `apps/web/server/utils/export/labels.ts`:

```ts
import type { ApplicationSource, ApplicationStatus } from "@job-tracker/shared";

/**
 * Authority-friendly wording for the AfA preset. Deliberately distinct from the
 * UI labels: a caseworker reads "Keine Rückmeldung", not "Geghostet".
 */
export const AFA_STATUS_LABELS: Record<ApplicationStatus, string> = {
    saved: "Vorgemerkt",
    applied: "Beworben",
    phone: "Telefoninterview",
    interview: "Vorstellungsgespräch",
    offer: "Angebot erhalten",
    rejected: "Absage erhalten",
    withdrawn: "Zurückgezogen",
    ghosted: "Keine Rückmeldung",
};

export const AFA_SOURCE_LABELS: Record<ApplicationSource, string> = {
    linkedin: "Online über LinkedIn",
    initiativ: "Initiativbewerbung",
    company_website: "Online über Unternehmensseite",
    indeed: "Online über Indeed",
    stepstone: "Online über StepStone",
    xing: "Online über Xing",
    other: "Sonstige",
};
```

(`saved` never appears in AfA exports because the row builder filters it, but the `Record` type requires every key.)

- [ ] **Step 2: Create the row builder**

Create `apps/web/server/utils/export/rows.ts`:

```ts
import type {
    Application,
    ApplicationStatus,
    Company,
    ExportPreset,
    Salary,
    Settings,
} from "@job-tracker/shared";
import {
    SOURCE_LABELS_DE,
    STATUS_LABELS_DE,
    WORK_MODE_LABELS_DE,
} from "@job-tracker/shared";
import { AFA_SOURCE_LABELS, AFA_STATUS_LABELS } from "./labels";

export interface ExportCell {
    value: string;
    /** Set on status cells so renderers can color them. */
    status?: ApplicationStatus;
}

export interface ExportColumn {
    header: string;
    /** Width in characters (XLSX); >= 28 renders as a flexible column in PDF. */
    width: number;
}

export interface ExportDocumentModel {
    title: string;
    exportedAtLabel: string;
    rangeLabel?: string;
    countLabel: string;
    applicantLine?: string;
    /** Set when rows is empty; renderers show it instead of data rows. */
    emptyNotice?: string;
    columns: ExportColumn[];
    rows: ExportCell[][];
    /** Download filename without extension. */
    filename: string;
}

export interface BuildExportParams {
    preset: ExportPreset;
    applications: Application[];
    companies: Company[];
    settings: Settings;
    from?: string;
    to?: string;
    includeArchived: boolean;
    exportedAt: Date;
}

const formatDate = (iso: string): string => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}.${d.getFullYear()}`;
};

const SALARY_PERIOD_LABELS: Record<Salary["period"], string> = {
    yearly: "Jahr",
    monthly: "Monat",
    hourly: "Stunde",
    daily: "Tag",
};

const formatSalary = (salary: Salary | undefined): string => {
    if (!salary || (salary.min === undefined && salary.max === undefined)) return "";
    const fmt = new Intl.NumberFormat("de-DE");
    const range =
        salary.min !== undefined && salary.max !== undefined
            ? `${fmt.format(salary.min)}–${fmt.format(salary.max)}`
            : fmt.format(salary.min ?? salary.max ?? 0);
    return `${range} ${salary.currency} / ${SALARY_PERIOD_LABELS[salary.period]}`;
};

const AFA_COLUMNS: ExportColumn[] = [
    { header: "Nr.", width: 6 },
    { header: "Datum der Bewerbung", width: 16 },
    { header: "Unternehmen", width: 28 },
    { header: "Ort", width: 18 },
    { header: "Stelle", width: 32 },
    { header: "Bewerbungsweg", width: 26 },
    { header: "Stand/Ergebnis", width: 20 },
];

const FULL_COLUMNS: ExportColumn[] = [
    ...AFA_COLUMNS,
    { header: "Arbeitsmodell", width: 13 },
    { header: "Gehalt", width: 22 },
    { header: "Tech-Stack", width: 30 },
    { header: "Bewertung", width: 10 },
    { header: "Link", width: 30 },
    { header: "Erstellt am", width: 12 },
    { header: "Follow-up am", width: 13 },
    { header: "Archiviert", width: 10 },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export const buildExportDocument = (params: BuildExportParams): ExportDocumentModel => {
    const companyById = new Map(params.companies.map((c) => [c.id, c]));
    const isAfa = params.preset === "afa";
    const dateKey = (a: Application): string =>
        isAfa ? (a.appliedAt ?? "") : (a.appliedAt ?? a.createdAt);

    let list = params.applications;
    if (isAfa) {
        list = list.filter((a) => a.appliedAt !== undefined);
    } else if (!params.includeArchived) {
        list = list.filter((a) => !a.archived);
    }

    const fromTs = params.from ? Date.parse(params.from) : undefined;
    // `to` is inclusive: a date like 2026-05-31 covers timestamps until end of that day.
    const toTs = params.to ? Date.parse(params.to) + DAY_MS - 1 : undefined;
    if (fromTs !== undefined || toTs !== undefined) {
        list = list.filter((a) => {
            const ts = Date.parse(dateKey(a));
            if (fromTs !== undefined && ts < fromTs) return false;
            if (toTs !== undefined && ts > toTs) return false;
            return true;
        });
    }

    const sorted = [...list].sort((a, b) => dateKey(a).localeCompare(dateKey(b)));

    const rows: ExportCell[][] = sorted.map((a, i) => {
        const company = companyById.get(a.companyId);
        const base: ExportCell[] = [
            { value: String(i + 1) },
            { value: a.appliedAt ? formatDate(a.appliedAt) : "" },
            { value: company?.name ?? "Unbekannt" },
            { value: a.location ?? company?.location ?? "" },
            { value: a.position },
            { value: isAfa ? AFA_SOURCE_LABELS[a.source] : SOURCE_LABELS_DE[a.source] },
            {
                value: isAfa ? AFA_STATUS_LABELS[a.status] : STATUS_LABELS_DE[a.status],
                status: a.status,
            },
        ];
        if (isAfa) return base;
        return [
            ...base,
            { value: a.workMode ? WORK_MODE_LABELS_DE[a.workMode] : "" },
            { value: formatSalary(a.salary) },
            { value: a.techStack.join(", ") },
            { value: a.rating !== undefined ? `${a.rating}/5` : "" },
            { value: a.sourceUrl ?? "" },
            { value: formatDate(a.createdAt) },
            { value: a.nextFollowUpAt ? formatDate(a.nextFollowUpAt) : "" },
            { value: a.archived ? "Ja" : "" },
        ];
    });

    const isoStamp = params.exportedAt.toISOString().slice(0, 10);
    const filename = isAfa
        ? params.from && params.to
          ? `eigenbemuehungen-${params.from.slice(0, 10)}_${params.to.slice(0, 10)}`
          : `eigenbemuehungen-${isoStamp}`
        : `bewerbungen-export-${isoStamp}`;

    const rangeLabel =
        params.from || params.to
            ? `Zeitraum: ${params.from ? formatDate(params.from) : "Anfang"} bis ${
                  params.to ? formatDate(params.to) : "heute"
              }`
            : undefined;

    const applicantParts = [
        params.settings.applicantName ? `Name: ${params.settings.applicantName}` : "",
        params.settings.baCustomerNumber
            ? `Kundennummer: ${params.settings.baCustomerNumber}`
            : "",
    ].filter((s) => s.length > 0);

    return {
        title: isAfa ? "Nachweis der Eigenbemühungen" : "Bewerbungsübersicht",
        exportedAtLabel: `Exportiert am ${formatDate(params.exportedAt.toISOString())}`,
        rangeLabel,
        countLabel: `${rows.length} ${rows.length === 1 ? "Bewerbung" : "Bewerbungen"}`,
        applicantLine: applicantParts.length > 0 ? applicantParts.join("  |  ") : undefined,
        emptyNotice: rows.length === 0 ? "Keine Einträge im Zeitraum" : undefined,
        columns: isAfa ? AFA_COLUMNS : FULL_COLUMNS,
        rows,
        filename,
    };
};
```

- [ ] **Step 3: Type-check**

Run: `pnpm types:check`
Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add apps/web/server/utils/export
git commit -m "feat(export): add AfA labels and pure row builder for tabular exports"
```

---

### Task 4: Server: CSV renderer

**Files:**
- Create: `apps/web/server/utils/export/csv.ts`

- [ ] **Step 1: Write the renderer**

Create `apps/web/server/utils/export/csv.ts`:

```ts
import type { ExportDocumentModel } from "./rows";

const escapeCell = (value: string): string => {
    if (/[";\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
};

/**
 * Semicolon-separated, CRLF line endings, UTF-8 BOM: the combination German
 * Excel opens correctly via double-click without an import wizard.
 */
export const renderCsv = (doc: ExportDocumentModel): Buffer => {
    const lines: string[] = [];
    lines.push(escapeCell(doc.title));
    if (doc.applicantLine) lines.push(escapeCell(doc.applicantLine));
    lines.push(escapeCell(doc.exportedAtLabel));
    if (doc.rangeLabel) lines.push(escapeCell(doc.rangeLabel));
    lines.push(escapeCell(doc.countLabel));
    lines.push("");
    lines.push(doc.columns.map((c) => escapeCell(c.header)).join(";"));
    for (const row of doc.rows) {
        lines.push(row.map((cell) => escapeCell(cell.value)).join(";"));
    }
    if (doc.emptyNotice) lines.push(escapeCell(doc.emptyNotice));
    // U+FEFF byte order mark, spelled out so no invisible character hides in source.
    const bom = String.fromCharCode(0xfeff);
    return Buffer.from(bom + lines.join("\r\n"), "utf8");
};
```

- [ ] **Step 2: Type-check**

Run: `pnpm types:check`
Expected: PASS.

- [ ] **Step 3: Commit**

```powershell
git add apps/web/server/utils/export/csv.ts
git commit -m "feat(export): add CSV renderer with BOM and semicolon separator"
```

---

### Task 5: Server: XLSX renderer (exceljs)

**Files:**
- Modify: `apps/web/package.json` (dependency)
- Create: `apps/web/server/utils/export/xlsx.ts`

- [ ] **Step 1: Install exceljs**

Run: `pnpm --filter @job-tracker/web add exceljs`
Expected: dependency added to `apps/web/package.json`.

- [ ] **Step 2: Write the renderer**

Create `apps/web/server/utils/export/xlsx.ts`:

```ts
import ExcelJS from "exceljs";
import type { ApplicationStatus } from "@job-tracker/shared";
import type { ExportDocumentModel } from "./rows";

/** ARGB pairs (soft fill, strong text) aligned with the UI status badge palette. */
const STATUS_COLORS: Record<ApplicationStatus, { fill: string; font: string }> = {
    saved: { fill: "FFF3F4F6", font: "FF6B7280" },
    applied: { fill: "FFE2E8F0", font: "FF334155" },
    phone: { fill: "FFE0F2FE", font: "FF075985" },
    interview: { fill: "FFDBEAFE", font: "FF1E40AF" },
    offer: { fill: "FFD1FAE5", font: "FF065F46" },
    rejected: { fill: "FFFEE2E2", font: "FF991B1B" },
    withdrawn: { fill: "FFFFEDD5", font: "FF9A3412" },
    ghosted: { fill: "FFE5E7EB", font: "FF374151" },
};

export const renderXlsx = async (doc: ExportDocumentModel): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Export");
    const colCount = doc.columns.length;

    const addMetaRow = (text: string, opts?: { bold?: boolean; size?: number }) => {
        const row = sheet.addRow([text]);
        sheet.mergeCells(row.number, 1, row.number, colCount);
        row.getCell(1).font = { bold: opts?.bold ?? false, size: opts?.size ?? 11 };
    };

    addMetaRow(doc.title, { bold: true, size: 14 });
    if (doc.applicantLine) addMetaRow(doc.applicantLine);
    const metaParts = [doc.exportedAtLabel, doc.rangeLabel, doc.countLabel].filter(
        (s): s is string => typeof s === "string" && s.length > 0,
    );
    addMetaRow(metaParts.join("   ·   "));
    sheet.addRow([]);

    const headerRow = sheet.addRow(doc.columns.map((c) => c.header));
    headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });

    for (const row of doc.rows) {
        const added = sheet.addRow(row.map((cell) => cell.value));
        row.forEach((cell, idx) => {
            if (!cell.status) return;
            const colors = STATUS_COLORS[cell.status];
            const target = added.getCell(idx + 1);
            target.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.fill } };
            target.font = { color: { argb: colors.font } };
        });
    }

    if (doc.emptyNotice) {
        const row = sheet.addRow([doc.emptyNotice]);
        sheet.mergeCells(row.number, 1, row.number, colCount);
        row.getCell(1).font = { italic: true };
    }

    doc.columns.forEach((col, idx) => {
        sheet.getColumn(idx + 1).width = col.width;
    });
    sheet.views = [{ state: "frozen", ySplit: headerRow.number }];
    sheet.autoFilter = {
        from: { row: headerRow.number, column: 1 },
        to: { row: headerRow.number + Math.max(doc.rows.length, 1), column: colCount },
    };

    const out = await workbook.xlsx.writeBuffer();
    return Buffer.from(new Uint8Array(out));
};
```

Note on the last line: exceljs types `writeBuffer()` as an ArrayBuffer-compatible type, and `Buffer.from(new Uint8Array(out))` normalizes it without casts. If tsc complains about the `Uint8Array` constructor argument, type the intermediate explicitly (`const out: ArrayBuffer = await workbook.xlsx.writeBuffer();`). `as` casts stay forbidden.

- [ ] **Step 3: Type-check**

Run: `pnpm types:check`
Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add apps/web/package.json pnpm-lock.yaml apps/web/server/utils/export/xlsx.ts
git commit -m "feat(export): add XLSX renderer with status colors, frozen header, autofilter"
```

---

### Task 6: Server: PDF renderer (pdfmake)

**Files:**
- Modify: `apps/web/package.json` (dependencies)
- Create: `apps/web/server/utils/export/pdf.ts`

- [ ] **Step 1: Install pdfmake and its types**

Run: `pnpm --filter @job-tracker/web add pdfmake`
Run: `pnpm --filter @job-tracker/web add -D @types/pdfmake`
Expected: both added to `apps/web/package.json`.

- [ ] **Step 2: Write the renderer**

Create `apps/web/server/utils/export/pdf.ts`:

```ts
import PdfPrinter from "pdfmake";
import type { Content, TDocumentDefinitions, TableCell } from "pdfmake/interfaces";
import type { ApplicationStatus } from "@job-tracker/shared";
import type { ExportDocumentModel } from "./rows";

/**
 * PDF standard-14 fonts: built into every PDF viewer, no font files to bundle,
 * WinAnsi encoding covers German umlauts. Avoids Nitro asset issues with
 * pdfmake's embedded Roboto entirely.
 */
const printer = new PdfPrinter({
    Helvetica: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
    },
});

const STATUS_COLORS: Record<ApplicationStatus, { fill: string; text: string }> = {
    saved: { fill: "#F3F4F6", text: "#6B7280" },
    applied: { fill: "#E2E8F0", text: "#334155" },
    phone: { fill: "#E0F2FE", text: "#075985" },
    interview: { fill: "#DBEAFE", text: "#1E40AF" },
    offer: { fill: "#D1FAE5", text: "#065F46" },
    rejected: { fill: "#FEE2E2", text: "#991B1B" },
    withdrawn: { fill: "#FFEDD5", text: "#9A3412" },
    ghosted: { fill: "#E5E7EB", text: "#374151" },
};

export const renderPdf = async (doc: ExportDocumentModel): Promise<Buffer> => {
    const headerCells: TableCell[] = doc.columns.map((c) => ({
        text: c.header,
        bold: true,
        color: "#FFFFFF",
        fillColor: "#1F2937",
    }));

    const bodyRows: TableCell[][] = doc.rows.map((row) =>
        row.map((cell) => {
            if (!cell.status) return { text: cell.value };
            const colors = STATUS_COLORS[cell.status];
            return { text: cell.value, fillColor: colors.fill, color: colors.text, bold: true };
        }),
    );

    if (bodyRows.length === 0 && doc.emptyNotice) {
        bodyRows.push([
            { text: doc.emptyNotice, italics: true, colSpan: doc.columns.length },
            ...Array.from({ length: doc.columns.length - 1 }, (): TableCell => ({ text: "" })),
        ]);
    }

    const metaParts = [doc.exportedAtLabel, doc.rangeLabel, doc.countLabel].filter(
        (s): s is string => typeof s === "string" && s.length > 0,
    );

    const content: Content = [
        { text: doc.title, fontSize: 16, bold: true, margin: [0, 0, 0, 2] },
        ...(doc.applicantLine
            ? [{ text: doc.applicantLine, fontSize: 10, margin: [0, 0, 0, 2] } satisfies Content]
            : []),
        { text: metaParts.join("   |   "), fontSize: 9, color: "#6B7280", margin: [0, 0, 0, 10] },
        {
            table: {
                headerRows: 1,
                widths: doc.columns.map((c) => (c.width >= 28 ? "*" : "auto")),
                body: [headerCells, ...bodyRows],
            },
            layout: {
                hLineColor: () => "#D1D5DB",
                vLineColor: () => "#D1D5DB",
                paddingTop: () => 4,
                paddingBottom: () => 4,
            },
        },
    ];

    const definition: TDocumentDefinitions = {
        pageSize: "A4",
        pageOrientation: "landscape",
        pageMargins: [24, 24, 24, 32],
        defaultStyle: { font: "Helvetica", fontSize: 9 },
        footer: (currentPage, pageCount) => ({
            text: `Seite ${currentPage} von ${pageCount}`,
            alignment: "right",
            fontSize: 8,
            color: "#6B7280",
            margin: [0, 8, 24, 0],
        }),
        content,
    };

    const pdfDoc = printer.createPdfKitDocument(definition);
    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
        pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
        pdfDoc.on("error", reject);
        pdfDoc.end();
    });
};
```

- [ ] **Step 3: Type-check**

Run: `pnpm types:check`
Expected: PASS. If `pdfmake/interfaces` types friction appears (the `Content` array spread is the usual suspect), restructure to push into a `Content[]` variable with explicit typing instead of inline spreads. Do not reach for `any`.

- [ ] **Step 4: Commit**

```powershell
git add apps/web/package.json pnpm-lock.yaml apps/web/server/utils/export/pdf.ts
git commit -m "feat(export): add PDF renderer with pdfmake and standard fonts"
```

---

### Task 7: Server: export route + lastExportAt cleanup

**Files:**
- Create: `apps/web/server/api/export/applications.get.ts`
- Modify: `apps/web/server/api/export.get.ts`

- [ ] **Step 1: Create the route**

Create `apps/web/server/api/export/applications.get.ts`:

```ts
import { tabularExportQuerySchema } from "@job-tracker/shared";
import { applicationsRepo } from "../../repositories/applications-repo";
import { companiesRepo } from "../../repositories/companies-repo";
import { settingsRepo } from "../../repositories/settings-repo";
import { readQueryAs } from "../../utils/validate";
import { buildExportDocument } from "../../utils/export/rows";
import { renderCsv } from "../../utils/export/csv";
import { renderXlsx } from "../../utils/export/xlsx";
import { renderPdf } from "../../utils/export/pdf";

const CONTENT_TYPES = {
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv; charset=utf-8",
    pdf: "application/pdf",
} as const;

export default defineEventHandler(async (event) => {
    const query = readQueryAs(event, tabularExportQuerySchema);
    const [applications, companies, settings] = await Promise.all([
        applicationsRepo.list({ includeArchived: true }),
        companiesRepo.list(),
        settingsRepo.get(),
    ]);

    const doc = buildExportDocument({
        preset: query.preset,
        applications,
        companies,
        settings,
        from: query.from,
        to: query.to,
        includeArchived: query.includeArchived,
        exportedAt: new Date(),
    });

    const buffer =
        query.format === "xlsx"
            ? await renderXlsx(doc)
            : query.format === "csv"
              ? renderCsv(doc)
              : await renderPdf(doc);

    await settingsRepo.update({ lastExportAt: new Date().toISOString() });

    setResponseHeader(event, "Content-Type", CONTENT_TYPES[query.format]);
    setResponseHeader(
        event,
        "Content-Disposition",
        `attachment; filename="${doc.filename}.${query.format}"`,
    );
    return buffer;
});
```

Note: the repo is queried with `includeArchived: true` on purpose: archived filtering is preset-dependent and lives in the row builder.

- [ ] **Step 2: Make the JSON export write lastExportAt too**

In `apps/web/server/api/export.get.ts`, after the `payload` object is built and before the filename line, add:

```ts
    await settingsRepo.update({ lastExportAt: payload.exportedAt });
```

(`settingsRepo` is already imported in that file.)

- [ ] **Step 3: Type-check and smoke-test the endpoint**

Run: `pnpm types:check`
Expected: PASS.

Start the dev server in the background: `pnpm dev`
Then verify (PowerShell):

```powershell
Invoke-WebRequest "http://localhost:3000/api/export/applications?format=csv&preset=afa" -OutFile "$env:TEMP\afa.csv"
Get-Content "$env:TEMP\afa.csv" -TotalCount 10
```

Expected: CSV with title "Nachweis der Eigenbemühungen", header row, German umlauts intact.

```powershell
Invoke-WebRequest "http://localhost:3000/api/export/applications?format=xlsx&preset=full" -OutFile "$env:TEMP\full.xlsx"
Invoke-WebRequest "http://localhost:3000/api/export/applications?format=pdf&preset=afa" -OutFile "$env:TEMP\afa.pdf"
```

Expected: both files non-empty; PDF starts with `%PDF`.

```powershell
try { Invoke-WebRequest "http://localhost:3000/api/export/applications?format=nope&preset=afa" } catch { $_.Exception.Response.StatusCode.value__ }
```

Expected: `422`.

- [ ] **Step 4: Commit**

```powershell
git add apps/web/server/api/export
git commit -m "feat(export): add tabular export route, write lastExportAt on both exports"
```

---

### Task 8: Frontend: ExportModal + button on the applications list

**Files:**
- Create: `apps/web/app/components/application/ExportModal.vue`
- Modify: `apps/web/app/pages/applications/index.vue`

- [ ] **Step 1: Create the modal component**

Create `apps/web/app/components/application/ExportModal.vue`:

```vue
<script setup lang="ts">
import type { ExportFormat, ExportPreset } from "@job-tracker/shared";

interface Props {
    open: boolean;
}

defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const t = useT();
const toast = useToast();

const preset = ref<ExportPreset>("afa");
const format = ref<ExportFormat>("xlsx");
const from = ref("");
const to = ref("");
const includeArchived = ref(false);

const presetOptions = [
    { value: "afa" as const, label: t.applications.export.presetAfa },
    { value: "full" as const, label: t.applications.export.presetFull },
];

const formatOptions = [
    { value: "xlsx" as const, label: t.applications.export.formatXlsx },
    { value: "csv" as const, label: t.applications.export.formatCsv },
    { value: "pdf" as const, label: t.applications.export.formatPdf },
];

const rangeError = computed(() =>
    from.value && to.value && from.value > to.value ? t.applications.export.invalidRange : "",
);

const download = () => {
    if (rangeError.value) return;
    const params = new URLSearchParams({ format: format.value, preset: preset.value });
    if (from.value) params.set("from", from.value);
    if (to.value) params.set("to", to.value);
    if (preset.value === "full" && includeArchived.value) {
        params.set("includeArchived", "true");
    }
    const a = document.createElement("a");
    a.href = `/api/export/applications?${params.toString()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(t.applications.export.started);
    emit("close");
};
</script>

<template>
    <UiModal :open="open" :title="t.applications.export.title" size="md" @close="emit('close')">
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
                <span class="text-xs font-medium text-jt-fg-soft">
                    {{ t.applications.export.preset }}
                </span>
                <UiSegmented v-model="preset" :options="presetOptions" />
                <p class="text-xs text-jt-fg-muted">
                    {{
                        preset === "afa"
                            ? t.applications.export.presetAfaHint
                            : t.applications.export.presetFullHint
                    }}
                </p>
            </div>
            <div class="flex flex-col gap-1.5">
                <span class="text-xs font-medium text-jt-fg-soft">
                    {{ t.applications.export.format }}
                </span>
                <UiSegmented v-model="format" :options="formatOptions" />
            </div>
            <div>
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput
                        v-model="from"
                        type="date"
                        :label="t.applications.export.from"
                        :error="rangeError"
                    />
                    <UiTextInput v-model="to" type="date" :label="t.applications.export.to" />
                </div>
                <p class="mt-1 text-xs text-jt-fg-muted">
                    {{ t.applications.export.rangeHint }}
                </p>
            </div>
            <UiCheckbox
                v-if="preset === 'full'"
                v-model="includeArchived"
                :label="t.applications.export.includeArchived"
            />
        </div>
        <template #footer>
            <UiButton variant="ghost" @click="emit('close')">
                {{ t.common.cancel }}
            </UiButton>
            <UiButton
                variant="brand"
                icon="i-lucide-download"
                :disabled="!!rangeError"
                @click="download"
            >
                {{ t.applications.export.submit }}
            </UiButton>
        </template>
    </UiModal>
</template>
```

- [ ] **Step 2: Wire it into the applications list page**

In `apps/web/app/pages/applications/index.vue`:

Add to the script block (after the `view` ref):

```ts
const exportOpen = ref(false);
```

In the template, inside `<template #actions>` before the existing "Neue Bewerbung" button, add:

```vue
                <UiButton
                    variant="outline"
                    icon="i-lucide-download"
                    @click="exportOpen = true"
                >
                    {{ t.applications.export.button }}
                </UiButton>
```

At the end of the root `<div>` (after the list/kanban markup), add:

```vue
        <ApplicationExportModal :open="exportOpen" @close="exportOpen = false" />
```

- [ ] **Step 3: Type-check and lint**

Run: `pnpm types:check`
Expected: PASS.

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add apps/web/app/components/application/ExportModal.vue apps/web/app/pages/applications/index.vue
git commit -m "feat(export): add export modal and button on applications list"
```

---

### Task 9: Settings page: applicant fields

**Files:**
- Modify: `apps/web/app/pages/settings.vue`

- [ ] **Step 1: Add local state and save handler**

In the script block of `apps/web/app/pages/settings.vue` (after the `weeklyGoal` computed), add:

```ts
const applicantName = ref("");
const baCustomerNumber = ref("");

watch(
    settings,
    (s) => {
        if (!s) return;
        applicantName.value = s.applicantName;
        baCustomerNumber.value = s.baCustomerNumber;
    },
    { immediate: true },
);

const saveApplicant = async () => {
    if (!settings.value) return;
    const name = applicantName.value.trim();
    const customerNumber = baCustomerNumber.value.trim();
    if (
        name === settings.value.applicantName &&
        customerNumber === settings.value.baCustomerNumber
    ) {
        return;
    }
    savingSettings.value = true;
    try {
        await settingsStore.update({ applicantName: name, baCustomerNumber: customerNumber });
        toast.success(t.toast.saved);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    } finally {
        savingSettings.value = false;
    }
};
```

Saving happens on blur, not per keystroke, because text fields would otherwise PATCH on every character.

- [ ] **Step 2: Add the inputs to the "Daten" section**

In the template, inside the "Daten" section (`t.settings.sections.data`), add as the FIRST child of its `<div class="flex flex-col gap-5">`, before the export block:

```vue
                    <div>
                        <h3 class="text-sm font-medium text-jt-fg">{{ t.settings.applicant }}</h3>
                        <p class="mt-1 text-xs text-jt-fg-muted">{{ t.settings.applicantHint }}</p>
                        <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <UiTextInput
                                v-model="applicantName"
                                :label="t.settings.applicantName"
                                @blur="saveApplicant"
                            />
                            <UiTextInput
                                v-model="baCustomerNumber"
                                :label="t.settings.baCustomerNumber"
                                @blur="saveApplicant"
                            />
                        </div>
                    </div>
```

The following sibling (`Daten exportieren` block) then needs `class="border-t border-jt-line-faint pt-5"` on its wrapper `<div>` to match the section's divider pattern. Check the existing siblings and mirror them.

- [ ] **Step 3: Type-check and lint**

Run: `pnpm types:check`
Expected: PASS.

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add apps/web/app/pages/settings.vue
git commit -m "feat(settings): add applicant name and BA customer number for export headers"
```

---

### Task 10: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full quality gate**

Run: `pnpm build:shared`, then `pnpm types:check`, then `pnpm lint`, then `pnpm format`
Expected: all PASS. Fix anything that fails before continuing.

- [ ] **Step 2: Browser flow via Playwright/Chrome MCP**

With `pnpm dev` running: open `http://localhost:3000/applications`, click "Exportieren", verify the modal shows preset/format/date fields, switch preset to "Komplett" and verify the archive checkbox appears, set an inverted date range and verify the error + disabled submit, then reset and trigger one download per format.

- [ ] **Step 3: File spot-checks**

- XLSX: open in Excel and check title row, applicant line (after filling the settings fields), colored status cells, frozen header, working AutoFilter, correct umlauts.
- CSV: open in Excel by double-click, check that columns split correctly and umlauts survive.
- PDF: open and check A4 landscape, table with colored status cells, page footer "Seite X von Y".
- AfA preset with a date range that has zero matches: document downloads and shows "Keine Einträge im Zeitraum".
- Settings page: fill name + Kundennummer, re-export, verify the applicant line appears.

- [ ] **Step 4: Commit any verification fixes, then push and open the PR**

```powershell
git push -u origin feat/applications-export
```

PR via `gh pr create` with title `feat: tabular applications export (XLSX/CSV/PDF) for Agentur fuer Arbeit`, body referencing the spec and ending with `Closes #1`, plus the standard Claude Code attribution footer.
