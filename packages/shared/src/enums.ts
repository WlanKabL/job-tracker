export const APPLICATION_STATUS = [
    "saved",
    "applied",
    "phone",
    "interview",
    "offer",
    "rejected",
    "withdrawn",
    "ghosted",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];

/** Statuses that count as "active" (still in the pipeline). */
export const ACTIVE_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
    "saved",
    "applied",
    "phone",
    "interview",
    "offer",
]);

/** Statuses that count as "closed" (no longer in the pipeline). */
export const CLOSED_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
    "rejected",
    "withdrawn",
    "ghosted",
]);

/** Statuses that count as "in process" for the response-rate metric. */
export const RESPONSIVE_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
    "phone",
    "interview",
    "offer",
]);

export const APPLICATION_SOURCE = [
    "linkedin",
    "initiativ",
    "company_website",
    "indeed",
    "stepstone",
    "xing",
    "other",
] as const;

export type ApplicationSource = (typeof APPLICATION_SOURCE)[number];

export const WORK_MODE = ["remote", "hybrid", "on_site"] as const;

export type WorkMode = (typeof WORK_MODE)[number];

export const TIMELINE_ENTRY_TYPE = [
    "status_change",
    "note",
    "email",
    "call",
    "meeting",
    "document",
] as const;

export type TimelineEntryType = (typeof TIMELINE_ENTRY_TYPE)[number];

export const DOCUMENT_TYPE = ["cv", "cover_letter", "portfolio", "other"] as const;

export type DocumentType = (typeof DOCUMENT_TYPE)[number];

export const COMPANY_SIZE = [
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1001-5000",
    "5001+",
] as const;

export type CompanySize = (typeof COMPANY_SIZE)[number];

/**
 * Allowed status transitions. From → to.
 * "saved" can go anywhere; closed statuses can be reopened to anything active.
 */
export const STATUS_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
    saved: ["applied", "withdrawn"],
    applied: ["phone", "interview", "offer", "rejected", "withdrawn", "ghosted"],
    phone: ["interview", "offer", "rejected", "withdrawn", "ghosted"],
    interview: ["interview", "offer", "rejected", "withdrawn", "ghosted"],
    offer: ["interview", "rejected", "withdrawn"],
    rejected: ["applied", "withdrawn"],
    withdrawn: ["saved", "applied"],
    ghosted: ["applied", "withdrawn"],
};

export const canTransition = (from: ApplicationStatus, to: ApplicationStatus): boolean => {
    if (from === to) return false;
    return STATUS_TRANSITIONS[from].includes(to);
};
