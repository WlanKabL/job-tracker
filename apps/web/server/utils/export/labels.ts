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
