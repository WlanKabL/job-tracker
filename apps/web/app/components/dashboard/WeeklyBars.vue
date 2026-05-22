<script setup lang="ts">
import type { WeeklyActivity } from "@job-tracker/shared";

interface Props {
    weeks: WeeklyActivity[];
}

const props = defineProps<Props>();
const t = useT();

const maxValue = computed(() =>
    Math.max(1, ...props.weeks.map((w) => Math.max(w.applied, w.interviews))),
);

const barHeight = (n: number): string => {
    if (n === 0) return "0%";
    return `${Math.max(4, Math.round((n / maxValue.value) * 100))}%`;
};

const total = computed(() => props.weeks.reduce((sum, w) => sum + w.applied, 0));
const peakWeek = computed(() =>
    props.weeks.reduce((peak, w) => (w.applied > peak.applied ? w : peak), props.weeks[0]!),
);
</script>

<template>
    <div class="flex flex-col gap-3">
        <header class="flex flex-wrap items-end justify-between gap-3">
            <div>
                <h3 class="text-sm font-semibold text-jt-fg">{{ t.dashboard.weekly.title }}</h3>
                <p class="text-xs text-jt-fg-muted">
                    {{ total }} Bewerbungen insgesamt · Peak {{ peakWeek.weekLabel }} ({{ peakWeek.applied }})
                </p>
            </div>
            <div class="flex items-center gap-3 text-xs text-jt-fg-muted">
                <span class="inline-flex items-center gap-1.5">
                    <span class="h-2 w-3 rounded-sm bg-jt-brand"></span>{{ t.dashboard.weekly.applied }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                    <span class="h-2 w-3 rounded-sm bg-jt-warning"></span>{{ t.dashboard.weekly.interviews }}
                </span>
            </div>
        </header>
        <div class="flex h-40 items-stretch gap-3 pt-2">
            <div
                v-for="week in weeks"
                :key="week.weekIso"
                class="flex flex-1 flex-col items-center gap-1.5"
            >
                <div class="flex w-full flex-1 items-end gap-1">
                    <div
                        class="flex-1 rounded-t bg-jt-brand/70 transition hover:bg-jt-brand"
                        :style="{ height: barHeight(week.applied) }"
                        :title="`${week.applied} ${t.dashboard.weekly.applied}`"
                    />
                    <div
                        class="flex-1 rounded-t bg-jt-warning/70 transition hover:bg-jt-warning"
                        :style="{ height: barHeight(week.interviews) }"
                        :title="`${week.interviews} ${t.dashboard.weekly.interviews}`"
                    />
                </div>
                <span class="text-[10px] tabular-nums text-jt-fg-faint">{{ week.weekLabel }}</span>
            </div>
        </div>
    </div>
</template>
