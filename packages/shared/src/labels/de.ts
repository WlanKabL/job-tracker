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
