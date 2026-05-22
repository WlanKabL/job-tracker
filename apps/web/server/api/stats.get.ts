import type {
    Application,
    ApplicationSource,
    ApplicationStatus,
    SourceCount,
    StatsResponse,
    StatusCount,
} from "@job-tracker/shared";
import {
    ACTIVE_STATUSES,
    APPLICATION_SOURCE,
    APPLICATION_STATUS,
    CLOSED_STATUSES,
    RESPONSIVE_STATUSES,
} from "@job-tracker/shared";
import { applicationsRepo } from "../repositories/applications-repo";
import { companiesRepo } from "../repositories/companies-repo";
import { settingsRepo } from "../repositories/settings-repo";

const WEEKS_TO_SHOW = 8;

export default defineEventHandler(async (): Promise<StatsResponse> => {
    const [apps, companies, settings] = await Promise.all([
        applicationsRepo.list({ includeArchived: false }),
        companiesRepo.list(),
        settingsRepo.get(),
    ]);

    const byStatus = countByStatus(apps);
    const bySource = countBySource(apps);
    const active = apps.filter((a) => ACTIVE_STATUSES.has(a.status)).length;
    const closed = apps.filter((a) => CLOSED_STATUSES.has(a.status)).length;

    const applied = apps.filter((a) => a.status !== "saved").length;
    const responded = apps.filter((a) => RESPONSIVE_STATUSES.has(a.status)).length;
    const responseRate = {
        applied,
        responded,
        ratio: applied > 0 ? Number((responded / applied).toFixed(3)) : 0,
    };

    const weekly = computeWeekly(apps);
    const weeklyGoal = computeWeeklyGoal(apps, settings.weeklyGoal);
    const upcomingFollowUps = await computeFollowUps(apps);

    return {
        totals: {
            applications: apps.length,
            active,
            closed,
            companies: companies.length,
        },
        byStatus,
        bySource,
        weekly,
        responseRate,
        weeklyGoal,
        upcomingFollowUps,
    };
});

const emptyStatusCount = (): StatusCount =>
    APPLICATION_STATUS.reduce<StatusCount>((acc, status) => {
        acc[status] = 0;
        return acc;
    }, {} as StatusCount);

const emptySourceCount = (): SourceCount =>
    APPLICATION_SOURCE.reduce<SourceCount>((acc, source) => {
        acc[source] = 0;
        return acc;
    }, {} as SourceCount);

const countByStatus = (apps: Application[]): StatusCount => {
    const out = emptyStatusCount();
    for (const a of apps) out[a.status as ApplicationStatus]++;
    return out;
};

const countBySource = (apps: Application[]): SourceCount => {
    const out = emptySourceCount();
    for (const a of apps) out[a.source as ApplicationSource]++;
    return out;
};

const startOfWeek = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    return d;
};

const isoWeekKey = (date: Date): string => {
    const monday = startOfWeek(date);
    return monday.toISOString().slice(0, 10);
};

const weekLabel = (date: Date): string => {
    const monday = startOfWeek(date);
    return monday.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
};

const computeWeekly = (apps: Application[]): StatsResponse["weekly"] => {
    const weeks: StatsResponse["weekly"] = [];
    const now = new Date();
    for (let i = WEEKS_TO_SHOW - 1; i >= 0; i--) {
        const cursor = startOfWeek(new Date(now.getTime() - i * 7 * 86_400_000));
        weeks.push({
            weekIso: cursor.toISOString().slice(0, 10),
            weekLabel: weekLabel(cursor),
            applied: 0,
            interviews: 0,
        });
    }
    const indexByKey = new Map(weeks.map((w, i) => [w.weekIso, i]));

    for (const app of apps) {
        for (const entry of app.timeline) {
            if (entry.type !== "status_change") continue;
            const key = isoWeekKey(new Date(entry.occurredAt));
            const idx = indexByKey.get(key);
            if (idx === undefined) continue;
            if (entry.toStatus === "applied") weeks[idx]!.applied++;
            if (entry.toStatus === "interview" || entry.toStatus === "phone")
                weeks[idx]!.interviews++;
        }
    }
    return weeks;
};

const computeWeeklyGoal = (
    apps: Application[],
    target: number,
): StatsResponse["weeklyGoal"] => {
    const monday = startOfWeek(new Date()).getTime();
    let thisWeek = 0;
    for (const app of apps) {
        for (const entry of app.timeline) {
            if (entry.type !== "status_change") continue;
            if (entry.toStatus !== "applied") continue;
            if (new Date(entry.occurredAt).getTime() >= monday) thisWeek++;
        }
    }
    return { target, thisWeek };
};

const computeFollowUps = async (
    apps: Application[],
): Promise<StatsResponse["upcomingFollowUps"]> => {
    const companies = await companiesRepo.list();
    const companyById = new Map(companies.map((c) => [c.id, c]));
    const horizon = Date.now() + 14 * 86_400_000;

    return apps
        .filter((a) => a.nextFollowUpAt)
        .filter((a) => ACTIVE_STATUSES.has(a.status))
        .filter((a) => new Date(a.nextFollowUpAt!).getTime() <= horizon)
        .map((a) => ({
            applicationId: a.id,
            companyName: companyById.get(a.companyId)?.name ?? "—",
            position: a.position,
            followUpAt: a.nextFollowUpAt!,
        }))
        .sort((a, b) => a.followUpAt.localeCompare(b.followUpAt))
        .slice(0, 10);
};
