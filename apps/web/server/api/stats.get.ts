import type {
    Application,
    ApplicationSource,
    ApplicationStatus,
    FunnelData,
    FunnelStageData,
    FunnelStageKey,
    GoalProgress,
    SourceCount,
    StatsResponse,
    StatusCount,
} from "@job-tracker/shared";
import {
    ACTIVE_STATUSES,
    APPLICATION_SOURCE,
    APPLICATION_STATUS,
    CLOSED_STATUSES,
    FUNNEL_STAGE_ORDER,
} from "@job-tracker/shared";
import { applicationsRepo } from "../repositories/applications-repo";
import { companiesRepo } from "../repositories/companies-repo";
import { settingsRepo } from "../repositories/settings-repo";

const WEEKS_TO_SHOW = 8;
const CLOSED_KEYS = ["rejected", "withdrawn", "ghosted"] as const;
type ClosedKey = (typeof CLOSED_KEYS)[number];

/** Responses where the company actually answered (rejected = answer, ghosted = no answer). */
const RESPONDED_STATUSES: ReadonlySet<ApplicationStatus> = new Set<ApplicationStatus>([
    "phone",
    "interview",
    "offer",
    "rejected",
]);

export default defineEventHandler(async (): Promise<StatsResponse> => {
    const [apps, companies, settings] = await Promise.all([
        applicationsRepo.list({ includeArchived: false }),
        companiesRepo.list(),
        settingsRepo.get(),
    ]);

    const byStatus = countByStatus(apps);
    const bySource = countBySource(apps);

    const savedCount = apps.filter((a) => a.status === "saved").length;
    const active = apps.filter((a) => ACTIVE_STATUSES.has(a.status) && a.status !== "saved").length;
    const closed = apps.filter((a) => CLOSED_STATUSES.has(a.status)).length;
    const appliedTotal = apps.length - savedCount;

    const responded = apps.filter((a) => RESPONDED_STATUSES.has(a.status)).length;
    const responseRate = {
        applied: appliedTotal,
        responded,
        ratio: appliedTotal > 0 ? Number((responded / appliedTotal).toFixed(3)) : 0,
    };

    const weekly = computeWeekly(apps);
    const goal = computeGoal(apps, settings.dailyGoal, settings.weeklyGoal);
    const funnel = computeFunnel(apps);
    const upcomingFollowUps = await computeFollowUps(apps);

    return {
        totals: {
            applications: appliedTotal,
            saved: savedCount,
            active,
            closed,
            companies: companies.length,
        },
        byStatus,
        bySource,
        weekly,
        responseRate,
        goal,
        funnel,
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

const startOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const startOfWeek = (date: Date): Date => {
    const d = startOfDay(date);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    return d;
};

const isoWeekKey = (date: Date): string => startOfWeek(date).toISOString().slice(0, 10);

const weekLabel = (date: Date): string =>
    startOfWeek(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

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

const computeGoal = (apps: Application[], dailyTarget: number, weeklyTarget: number): GoalProgress => {
    const todayStart = startOfDay(new Date()).getTime();
    const weekStart = startOfWeek(new Date()).getTime();
    let today = 0;
    let thisWeek = 0;
    for (const app of apps) {
        for (const entry of app.timeline) {
            if (entry.type !== "status_change") continue;
            if (entry.toStatus !== "applied") continue;
            const ts = new Date(entry.occurredAt).getTime();
            if (ts >= todayStart) today++;
            if (ts >= weekStart) thisWeek++;
        }
    }
    return { dailyTarget, weeklyTarget, today, thisWeek };
};

const maxReachedStageIndex = (app: Application): number => {
    let max = -1;
    const currentIdx = (FUNNEL_STAGE_ORDER as readonly string[]).indexOf(app.status);
    if (currentIdx !== -1) max = currentIdx;
    for (const entry of app.timeline) {
        if (entry.type !== "status_change" || !entry.toStatus) continue;
        const ti = (FUNNEL_STAGE_ORDER as readonly string[]).indexOf(entry.toStatus);
        if (ti > max) max = ti;
    }
    return max;
};

const emptyDropped = () => ({ rejected: 0, withdrawn: 0, ghosted: 0, total: 0 });

const computeFunnel = (apps: Application[]): FunnelData => {
    const stages: FunnelStageData[] = FUNNEL_STAGE_ORDER.map((key) => ({
        key,
        reached: 0,
        active: 0,
        continued: 0,
        dropped: emptyDropped(),
    }));

    for (const app of apps) {
        const maxIdx = maxReachedStageIndex(app);
        if (maxIdx < 0) continue;
        for (let i = 0; i <= maxIdx; i++) {
            stages[i]!.reached++;
        }
        const isClosed = CLOSED_STATUSES.has(app.status);
        const stage = stages[maxIdx]!;
        if (isClosed) {
            const key = app.status as ClosedKey;
            stage.dropped[key]++;
            stage.dropped.total++;
        } else {
            stage.active++;
        }
    }

    // continued = reached of next stage
    for (let i = 0; i < stages.length; i++) {
        stages[i]!.continued = i < stages.length - 1 ? stages[i + 1]!.reached : 0;
    }

    return { stages };
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

// silence unused-import warning for FunnelStageKey (used only in type assertions in the future)
void undefined as unknown as FunnelStageKey | undefined;
