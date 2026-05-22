import { APPLICATION_SOURCE, APPLICATION_STATUS } from "../enums.js";

export type StatusCount = Record<(typeof APPLICATION_STATUS)[number], number>;
export type SourceCount = Record<(typeof APPLICATION_SOURCE)[number], number>;

export interface WeeklyActivity {
    weekIso: string;
    weekLabel: string;
    applied: number;
    interviews: number;
}

export interface StatsResponse {
    totals: {
        applications: number;
        active: number;
        closed: number;
        companies: number;
    };
    byStatus: StatusCount;
    bySource: SourceCount;
    weekly: WeeklyActivity[];
    responseRate: {
        applied: number;
        responded: number;
        ratio: number;
    };
    weeklyGoal: {
        target: number;
        thisWeek: number;
    };
    upcomingFollowUps: Array<{
        applicationId: string;
        companyName: string;
        position: string;
        followUpAt: string;
    }>;
}
