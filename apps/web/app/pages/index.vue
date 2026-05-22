<script setup lang="ts">
import type { ApplicationStatus } from "@job-tracker/shared";

const t = useT();
const api = useApi();
const store = useApplicationsStore();

useHead({ title: t.dashboard.title });

const statsResp = await useAsyncData("stats", () => api.stats.get());
await store.fetchAll();

const stats = statsResp.data;

const recent = computed(() =>
    [...store.items]
        .filter((a) => !a.archived)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
);

const responseRatePercent = computed(() =>
    stats.value ? Math.round(stats.value.responseRate.ratio * 100) : 0,
);

const clampedPercent = (value: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((value / target) * 100));
};

const dailyPercent = computed(() =>
    stats.value ? clampedPercent(stats.value.goal.today, stats.value.goal.dailyTarget) : 0,
);
const weeklyPercent = computed(() =>
    stats.value ? clampedPercent(stats.value.goal.thisWeek, stats.value.goal.weeklyTarget) : 0,
);

const goalLabel = (value: number, target: number): string => {
    if (target === 0) return "Kein Ziel gesetzt";
    if (value >= target) {
        const over = value - target;
        return over === 0 ? "Ziel erreicht." : `Ziel erreicht — ${over} über Ziel.`;
    }
    const remaining = target - value;
    return `Noch ${remaining} ${remaining === 1 ? "Bewerbung" : "Bewerbungen"}.`;
};

const followUpHint = (iso: string) => {
    const days = daysBetween(iso);
    if (days < 0) return t.dashboard.followUps.overdueBy(Math.abs(days));
    return t.dashboard.followUps.dueIn(days);
};

const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
});

const statusBreakdown = computed(() => {
    if (!stats.value) return [];
    const totalAll = Object.values(stats.value.byStatus).reduce((sum, n) => sum + n, 0) || 1;
    const order: ApplicationStatus[] = [
        "saved",
        "applied",
        "phone",
        "interview",
        "offer",
        "rejected",
        "withdrawn",
        "ghosted",
    ];
    return order
        .map((status) => ({
            status,
            count: stats.value!.byStatus[status],
            ratio: stats.value!.byStatus[status] / totalAll,
            meta: useStatusMeta(status),
        }))
        .filter((row) => row.count > 0);
});

const heroSubtitle = computed(() => {
    if (!stats.value) return "";
    if (stats.value.totals.applications === 0 && stats.value.totals.saved === 0) {
        return "Noch keine Bewerbungen — bring den ersten Eintrag mit dem JSON-Import auf den Weg.";
    }
    const parts: string[] = [];
    parts.push(
        `${stats.value.totals.active} aktive Bewerbung${stats.value.totals.active === 1 ? "" : "en"}`,
    );
    if (stats.value.totals.saved > 0) {
        parts.push(
            `${stats.value.totals.saved} vorgemerkt${stats.value.totals.saved === 1 ? "" : "e"}`,
        );
    }
    parts.push(
        `${stats.value.upcomingFollowUps.length} Follow-Up${stats.value.upcomingFollowUps.length === 1 ? "" : "s"} in 14 Tagen`,
    );
    return parts.join(" · ");
});
</script>

<template>
    <div>
        <div v-if="!stats" class="flex justify-center py-10">
            <UiSpinner :label="t.common.loading" />
        </div>

        <div v-else class="flex flex-col gap-6">
            <section
                class="relative overflow-hidden rounded-2xl border border-jt-line bg-gradient-to-br from-jt-brand-soft via-jt-surface to-jt-surface p-6 sm:p-8"
            >
                <div class="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div class="max-w-xl">
                        <p class="text-xs uppercase tracking-wider text-jt-fg-muted">
                            {{ greeting }}
                        </p>
                        <h1 class="mt-1 text-3xl font-semibold tracking-tight text-jt-fg sm:text-4xl">
                            {{ t.dashboard.title }}
                        </h1>
                        <p class="mt-2 text-sm text-jt-fg-soft">
                            {{ heroSubtitle }}
                        </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <UiButton variant="brand" icon="i-lucide-plus" @click="navigateTo('/applications/new')">
                            {{ t.nav.newApplication }}
                        </UiButton>
                        <UiButton variant="outline" icon="i-lucide-sparkles" @click="navigateTo('/prompts')">
                            {{ t.nav.prompts }}
                        </UiButton>
                    </div>
                </div>
                <div
                    aria-hidden="true"
                    class="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-jt-brand opacity-10 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    class="pointer-events-none absolute -bottom-20 right-20 h-56 w-56 rounded-full bg-jt-success opacity-5 blur-3xl"
                />
            </section>

            <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <DashboardStatCard
                    label="Beworben"
                    :value="stats.totals.applications"
                    icon="i-lucide-send"
                    accent="brand"
                    hint="Tatsächlich abgeschickt"
                />
                <DashboardStatCard
                    label="Aktiv im Prozess"
                    :value="stats.totals.active"
                    icon="i-lucide-activity"
                    accent="warning"
                    hint="Phone / Interview / Offer"
                />
                <DashboardStatCard
                    label="Vorgemerkt"
                    :value="stats.totals.saved"
                    icon="i-lucide-bookmark"
                    hint="Noch nicht abgeschickt"
                />
                <DashboardStatCard
                    label="Unternehmen"
                    :value="stats.totals.companies"
                    icon="i-lucide-building-2"
                />
                <DashboardStatCard
                    label="Response Rate"
                    :value="`${responseRatePercent}%`"
                    :hint="`${stats.responseRate.responded}/${stats.responseRate.applied} bekommen Antwort`"
                    icon="i-lucide-message-circle-reply"
                    accent="success"
                />
            </div>

            <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div class="xl:col-span-2">
                    <DashboardFunnelChart :funnel="stats.funnel" />
                </div>

                <div class="flex flex-col gap-4">
                    <div class="rounded-xl border border-jt-line bg-jt-surface p-5">
                        <header class="mb-3 flex items-center justify-between">
                            <h3 class="text-xs uppercase tracking-wide text-jt-fg-muted">
                                Tagesziel
                            </h3>
                            <Icon name="i-lucide-sunrise" class="h-4 w-4 text-jt-warning" />
                        </header>
                        <div class="flex items-baseline gap-2">
                            <span class="text-3xl font-semibold text-jt-fg tabular-nums">
                                {{ stats.goal.today }}
                            </span>
                            <span class="text-base text-jt-fg-muted">
                                / {{ stats.goal.dailyTarget }}
                            </span>
                            <span
                                v-if="stats.goal.today >= stats.goal.dailyTarget"
                                class="ml-auto rounded-full bg-jt-success-soft px-2 py-0.5 text-[11px] font-medium text-jt-success"
                            >
                                ✓
                            </span>
                        </div>
                        <div class="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-jt-surface-raised">
                            <div
                                class="h-full rounded-full bg-gradient-to-r from-jt-warning to-jt-brand transition-all"
                                :style="{ width: `${dailyPercent}%` }"
                            />
                        </div>
                        <p class="mt-2 text-xs text-jt-fg-muted">
                            {{ goalLabel(stats.goal.today, stats.goal.dailyTarget) }}
                        </p>
                    </div>

                    <div class="rounded-xl border border-jt-line bg-jt-surface p-5">
                        <header class="mb-3 flex items-center justify-between">
                            <h3 class="text-xs uppercase tracking-wide text-jt-fg-muted">
                                Wochenziel
                            </h3>
                            <Icon name="i-lucide-target" class="h-4 w-4 text-jt-brand" />
                        </header>
                        <div class="flex items-baseline gap-2">
                            <span class="text-3xl font-semibold text-jt-fg tabular-nums">
                                {{ stats.goal.thisWeek }}
                            </span>
                            <span class="text-base text-jt-fg-muted">
                                / {{ stats.goal.weeklyTarget }}
                            </span>
                            <span
                                v-if="stats.goal.thisWeek >= stats.goal.weeklyTarget"
                                class="ml-auto rounded-full bg-jt-success-soft px-2 py-0.5 text-[11px] font-medium text-jt-success"
                            >
                                ✓
                            </span>
                        </div>
                        <div class="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-jt-surface-raised">
                            <div
                                class="h-full rounded-full bg-gradient-to-r from-jt-brand to-jt-info transition-all"
                                :style="{ width: `${weeklyPercent}%` }"
                            />
                        </div>
                        <p class="mt-2 text-xs text-jt-fg-muted">
                            {{ goalLabel(stats.goal.thisWeek, stats.goal.weeklyTarget) }}
                        </p>
                    </div>

                    <div class="rounded-xl border border-jt-line bg-jt-surface p-5">
                        <header class="mb-3 flex items-center justify-between">
                            <h3 class="text-xs uppercase tracking-wide text-jt-fg-muted">
                                Status-Verteilung
                            </h3>
                            <span class="text-xs text-jt-fg-muted tabular-nums">
                                {{ stats.totals.applications + stats.totals.saved }}
                            </span>
                        </header>
                        <p v-if="statusBreakdown.length === 0" class="text-sm italic text-jt-fg-faint">
                            {{ t.common.empty }}
                        </p>
                        <ul v-else class="flex flex-col gap-1.5">
                            <li
                                v-for="row in statusBreakdown"
                                :key="row.status"
                                class="flex items-center gap-2"
                            >
                                <span :class="['h-2 w-2 rounded-full', row.meta.dotClass]" />
                                <span class="flex-1 truncate text-sm text-jt-fg-soft">
                                    {{ row.meta.label }}
                                </span>
                                <span class="text-sm font-medium text-jt-fg tabular-nums">{{ row.count }}</span>
                                <span class="w-10 text-right text-xs text-jt-fg-faint tabular-nums">
                                    {{ Math.round(row.ratio * 100) }}%
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="rounded-xl border border-jt-line bg-jt-surface p-5">
                <DashboardWeeklyBars :weeks="stats.weekly" />
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div class="rounded-xl border border-jt-line bg-jt-surface p-5">
                    <header class="mb-3 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Icon name="i-lucide-alarm-clock" class="h-4 w-4 text-jt-warning" />
                            <h3 class="text-sm font-semibold text-jt-fg">
                                {{ t.dashboard.followUps.title }}
                            </h3>
                        </div>
                        <span class="rounded-full bg-jt-surface-raised px-2 py-0.5 text-xs text-jt-fg-muted">
                            {{ stats.upcomingFollowUps.length }}
                        </span>
                    </header>
                    <p
                        v-if="stats.upcomingFollowUps.length === 0"
                        class="text-sm italic text-jt-fg-faint"
                    >
                        {{ t.dashboard.followUps.none }}
                    </p>
                    <ul v-else class="flex flex-col gap-2">
                        <li v-for="fu in stats.upcomingFollowUps" :key="fu.applicationId">
                            <NuxtLink
                                :to="`/applications/${fu.applicationId}`"
                                class="flex items-center justify-between gap-3 rounded-md border border-jt-line bg-jt-base px-3 py-2 transition hover:border-jt-fg-faint hover:bg-jt-surface-hover"
                            >
                                <div class="min-w-0">
                                    <div class="truncate text-sm font-medium text-jt-fg">
                                        {{ fu.position }}
                                    </div>
                                    <div class="truncate text-xs text-jt-fg-muted">
                                        {{ fu.companyName }}
                                    </div>
                                </div>
                                <span
                                    :class="[
                                        'whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium',
                                        daysBetween(fu.followUpAt) < 0
                                            ? 'bg-jt-danger-soft text-jt-danger'
                                            : 'bg-jt-surface-raised text-jt-fg-soft',
                                    ]"
                                >
                                    {{ followUpHint(fu.followUpAt) }}
                                </span>
                            </NuxtLink>
                        </li>
                    </ul>
                </div>

                <div class="rounded-xl border border-jt-line bg-jt-surface p-5">
                    <header class="mb-3 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Icon name="i-lucide-history" class="h-4 w-4 text-jt-brand" />
                            <h3 class="text-sm font-semibold text-jt-fg">
                                {{ t.dashboard.recent.title }}
                            </h3>
                        </div>
                        <NuxtLink
                            to="/applications"
                            class="inline-flex items-center gap-1 text-xs text-jt-brand hover:underline"
                        >
                            {{ t.dashboard.recent.seeAll }}
                            <Icon name="i-lucide-arrow-right" class="h-3 w-3" />
                        </NuxtLink>
                    </header>
                    <p v-if="recent.length === 0" class="text-sm italic text-jt-fg-faint">
                        {{ t.applications.empty }}
                    </p>
                    <ul v-else class="flex flex-col gap-2">
                        <li v-for="app in recent" :key="app.id">
                            <NuxtLink
                                :to="`/applications/${app.id}`"
                                class="flex items-center justify-between gap-3 rounded-md border border-jt-line bg-jt-base px-3 py-2 transition hover:border-jt-fg-faint hover:bg-jt-surface-hover"
                            >
                                <div class="min-w-0">
                                    <div class="truncate text-sm font-medium text-jt-fg">
                                        {{ app.position }}
                                    </div>
                                    <div class="truncate text-xs text-jt-fg-muted">
                                        {{ app.company?.name ?? t.common.unknown }}
                                    </div>
                                </div>
                                <UiStatusBadge :status="app.status" size="sm" />
                            </NuxtLink>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>
