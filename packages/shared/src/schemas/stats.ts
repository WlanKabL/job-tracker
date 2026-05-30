import { APPLICATION_SOURCE, APPLICATION_STATUS } from "../enums.js";

export type StatusCount = Record<(typeof APPLICATION_STATUS)[number], number>;
export type SourceCount = Record<(typeof APPLICATION_SOURCE)[number], number>;

export interface WeeklyActivity {
    weekIso: string;
    weekLabel: string;
    applied: number;
    interviews: number;
}

export const FUNNEL_STAGE_ORDER = ["applied", "phone", "interview", "offer"] as const;
export type FunnelStageKey = (typeof FUNNEL_STAGE_ORDER)[number];

export interface FunnelStageData {
    key: FunnelStageKey;
    /** How many applications ever entered this stage. */
    reached: number;
    /** Currently sitting at this stage as their max progress, still active. */
    active: number;
    /** Moved past this stage to the next one. */
    continued: number;
    /** Apps that closed at this stage without progressing further. */
    dropped: {
        rejected: number;
        withdrawn: number;
        ghosted: number;
        total: number;
    };
}

export interface FunnelData {
    stages: FunnelStageData[];
}

export interface GoalProgress {
    dailyTarget: number;
    weeklyTarget: number;
    today: number;
    thisWeek: number;
}

/** Time from "applied" to the first real company response, in days. */
export interface ResponseTimeStats {
    /** Average across all applications that received a response. */
    avgDays: number;
    /** Fastest response. */
    minDays: number;
    /** Slowest response. */
    maxDays: number;
    /** How many applications contributed to these numbers. */
    sampleSize: number;
}

export interface StatsResponse {
    totals: {
        /** Applications that were actually sent out (status !== "saved"). */
        applications: number;
        /** Saved/bookmarked applications (not yet sent). */
        saved: number;
        /** Active in the pipeline (applied, phone, interview, offer). */
        active: number;
        /** Closed (rejected, withdrawn, ghosted). */
        closed: number;
        companies: number;
    };
    byStatus: StatusCount;
    bySource: SourceCount;
    weekly: WeeklyActivity[];
    /** Response rate = % of applied that got ANY response from the company. */
    responseRate: {
        applied: number;
        responded: number;
        ratio: number;
    };
    goal: GoalProgress;
    /** Time-to-first-response stats (avg/min/max) across responded applications. */
    responseTime: ResponseTimeStats;
    funnel: FunnelData;
    upcomingFollowUps: Array<{
        applicationId: string;
        companyName: string;
        position: string;
        followUpAt: string;
    }>;
}
