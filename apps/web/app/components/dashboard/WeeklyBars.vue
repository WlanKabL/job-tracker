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

const barHeight = (n: number) => `${Math.max(2, Math.round((n / maxValue.value) * 100))}%`;
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between text-xs text-jt-fg-muted">
            <span>{{ t.dashboard.weekly.title }}</span>
            <span class="flex items-center gap-3">
                <span class="inline-flex items-center gap-1">
                    <span class="h-2 w-2 rounded-sm bg-jt-brand"></span>{{ t.dashboard.weekly.applied }}
                </span>
                <span class="inline-flex items-center gap-1">
                    <span class="h-2 w-2 rounded-sm bg-jt-warning"></span>{{ t.dashboard.weekly.interviews }}
                </span>
            </span>
        </div>
        <div class="flex items-end gap-3 h-32">
            <div
                v-for="week in weeks"
                :key="week.weekIso"
                class="flex flex-1 flex-col items-center gap-1"
            >
                <div class="flex w-full flex-1 items-end gap-0.5">
                    <div
                        class="w-1/2 rounded-t bg-jt-brand/80"
                        :style="{ height: barHeight(week.applied) }"
                        :title="`${week.applied} ${t.dashboard.weekly.applied}`"
                    />
                    <div
                        class="w-1/2 rounded-t bg-jt-warning/80"
                        :style="{ height: barHeight(week.interviews) }"
                        :title="`${week.interviews} ${t.dashboard.weekly.interviews}`"
                    />
                </div>
                <span class="text-[10px] text-jt-fg-faint">{{ week.weekLabel }}</span>
            </div>
        </div>
    </div>
</template>
