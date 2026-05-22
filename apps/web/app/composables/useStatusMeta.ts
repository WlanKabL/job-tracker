import type { ApplicationSource, ApplicationStatus } from "@job-tracker/shared";
import { t } from "~/i18n/de";

/** Tailwind class bundles for each status — uses semantic jt-* tokens. */
export interface StatusMeta {
    label: string;
    icon: string;
    badgeClass: string;
    dotClass: string;
}

const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
    saved: {
        label: t.status.saved,
        icon: "i-lucide-bookmark",
        badgeClass: "bg-jt-surface text-jt-fg-soft border-jt-line",
        dotClass: "bg-jt-fg-muted",
    },
    applied: {
        label: t.status.applied,
        icon: "i-lucide-send",
        badgeClass: "bg-jt-info-soft text-jt-info border-jt-info/30",
        dotClass: "bg-jt-info",
    },
    phone: {
        label: t.status.phone,
        icon: "i-lucide-phone",
        badgeClass: "bg-jt-info-soft text-jt-info border-jt-info/30",
        dotClass: "bg-jt-info",
    },
    interview: {
        label: t.status.interview,
        icon: "i-lucide-users",
        badgeClass: "bg-jt-warning-soft text-jt-warning border-jt-warning/30",
        dotClass: "bg-jt-warning",
    },
    offer: {
        label: t.status.offer,
        icon: "i-lucide-party-popper",
        badgeClass: "bg-jt-success-soft text-jt-success border-jt-success/30",
        dotClass: "bg-jt-success",
    },
    rejected: {
        label: t.status.rejected,
        icon: "i-lucide-x-circle",
        badgeClass: "bg-jt-danger-soft text-jt-danger border-jt-danger/30",
        dotClass: "bg-jt-danger",
    },
    withdrawn: {
        label: t.status.withdrawn,
        icon: "i-lucide-undo-2",
        badgeClass: "bg-jt-surface text-jt-fg-muted border-jt-line",
        dotClass: "bg-jt-fg-faint",
    },
    ghosted: {
        label: t.status.ghosted,
        icon: "i-lucide-ghost",
        badgeClass: "bg-jt-surface text-jt-fg-muted border-jt-line",
        dotClass: "bg-jt-fg-faint",
    },
};

export const useStatusMeta = (status: ApplicationStatus): StatusMeta => STATUS_META[status];

export const allStatusMeta = (): Array<{ value: ApplicationStatus; meta: StatusMeta }> =>
    (Object.keys(STATUS_META) as ApplicationStatus[]).map((value) => ({
        value,
        meta: STATUS_META[value],
    }));

export interface SourceMeta {
    label: string;
    icon: string;
}

const SOURCE_META: Record<ApplicationSource, SourceMeta> = {
    linkedin: { label: t.source.linkedin, icon: "i-simple-icons-linkedin" },
    initiativ: { label: t.source.initiativ, icon: "i-lucide-sparkles" },
    company_website: { label: t.source.company_website, icon: "i-lucide-globe" },
    indeed: { label: t.source.indeed, icon: "i-simple-icons-indeed" },
    stepstone: { label: t.source.stepstone, icon: "i-lucide-briefcase" },
    xing: { label: t.source.xing, icon: "i-simple-icons-xing" },
    other: { label: t.source.other, icon: "i-lucide-link" },
};

export const useSourceMeta = (source: ApplicationSource): SourceMeta => SOURCE_META[source];

export const allSourceMeta = (): Array<{ value: ApplicationSource; meta: SourceMeta }> =>
    (Object.keys(SOURCE_META) as ApplicationSource[]).map((value) => ({
        value,
        meta: SOURCE_META[value],
    }));
