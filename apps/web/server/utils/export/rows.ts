import type {
    Application,
    ApplicationStatus,
    Company,
    ExportPreset,
    Salary,
    Settings,
} from "@job-tracker/shared";
import { SOURCE_LABELS_DE, STATUS_LABELS_DE, WORK_MODE_LABELS_DE } from "@job-tracker/shared";
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
