<script setup lang="ts">
import type { Application } from "@job-tracker/shared";

interface Props {
    applications: Application[];
}

const props = defineProps<Props>();
const t = useT();

const STAGE_ORDER = ["applied", "phone", "interview", "offer"] as const;
type Stage = (typeof STAGE_ORDER)[number];

const STAGE_LABEL: Record<Stage, string> = {
    applied: t.status.applied,
    phone: t.status.phone,
    interview: t.status.interview,
    offer: t.status.offer,
};

const STAGE_COLOR: Record<Stage, string> = {
    applied: "var(--jt-info)",
    phone: "var(--jt-info)",
    interview: "var(--jt-warning)",
    offer: "var(--jt-success)",
};

interface StageData {
    key: Stage;
    label: string;
    value: number;
    color: string;
}

const maxReachedStageIndex = (app: Application): number => {
    let max = -1;
    const currentIdx = (STAGE_ORDER as readonly string[]).indexOf(app.status);
    if (currentIdx !== -1) max = currentIdx;
    for (const entry of app.timeline) {
        if (entry.type !== "status_change" || !entry.toStatus) continue;
        const ti = (STAGE_ORDER as readonly string[]).indexOf(entry.toStatus);
        if (ti > max) max = ti;
    }
    return max;
};

const stages = computed<StageData[]>(() => {
    const counts: Record<Stage, number> = { applied: 0, phone: 0, interview: 0, offer: 0 };
    for (const app of props.applications) {
        const maxIdx = maxReachedStageIndex(app);
        for (let i = 0; i <= maxIdx; i++) {
            counts[STAGE_ORDER[i]!]++;
        }
    }
    return STAGE_ORDER.map((key) => ({
        key,
        label: STAGE_LABEL[key],
        value: counts[key],
        color: STAGE_COLOR[key],
    }));
});

const droppedCounts = computed<number[]>(() =>
    stages.value.map((s, i) =>
        i === 0 ? 0 : Math.max(0, stages.value[i - 1]!.value - s.value),
    ),
);

const conversionRates = computed<number[]>(() =>
    stages.value.map((s, i) => {
        if (i === 0) return 100;
        const prev = stages.value[i - 1]!.value;
        if (prev === 0) return 0;
        return Math.round((s.value / prev) * 100);
    }),
);

const totalConversion = computed(() => {
    const last = stages.value[stages.value.length - 1]!.value;
    const first = stages.value[0]!.value;
    if (first === 0) return 0;
    return Math.round((last / first) * 100);
});

const BLOCK_WIDTH = 90;
const GAP = 80;
const CHART_HEIGHT = 200;
const LABEL_TOP = 36;
const LABEL_BOTTOM = 60;
const totalWidth = computed(() => stages.value.length * BLOCK_WIDTH + (stages.value.length - 1) * GAP);
const totalHeight = LABEL_TOP + CHART_HEIGHT + LABEL_BOTTOM;

const maxValue = computed(() => Math.max(1, ...stages.value.map((s) => s.value)));

interface Geometry {
    x: number;
    yTop: number;
    yBottom: number;
    height: number;
}

const geometries = computed<Geometry[]>(() =>
    stages.value.map((s, i) => {
        const height = (s.value / maxValue.value) * CHART_HEIGHT;
        const yTop = LABEL_TOP + (CHART_HEIGHT - height) / 2;
        return {
            x: i * (BLOCK_WIDTH + GAP),
            yTop,
            yBottom: yTop + height,
            height,
        };
    }),
);

const connectorPath = (i: number): string => {
    if (i === 0) return "";
    const prev = geometries.value[i - 1]!;
    const cur = geometries.value[i]!;
    const x1 = prev.x + BLOCK_WIDTH;
    const x2 = cur.x;
    const cpx = (x1 + x2) / 2;
    return `M ${x1} ${prev.yTop} C ${cpx} ${prev.yTop} ${cpx} ${cur.yTop} ${x2} ${cur.yTop} L ${x2} ${cur.yBottom} C ${cpx} ${cur.yBottom} ${cpx} ${prev.yBottom} ${x1} ${prev.yBottom} Z`;
};

const isEmpty = computed(() => props.applications.length === 0);
</script>

<template>
    <div class="rounded-xl border border-jt-line bg-jt-surface p-5">
        <header class="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
                <h3 class="text-sm font-semibold text-jt-fg">Funnel</h3>
                <p class="text-xs text-jt-fg-muted">Bewerbungs-Conversion über alle aktiven Bewerbungen.</p>
            </div>
            <div v-if="!isEmpty" class="text-right">
                <div class="text-2xl font-semibold text-jt-fg">{{ totalConversion }}%</div>
                <div class="text-[11px] uppercase tracking-wide text-jt-fg-muted">Beworben → Offer</div>
            </div>
        </header>

        <div v-if="isEmpty" class="flex h-48 items-center justify-center text-sm italic text-jt-fg-faint">
            Noch keine Daten — importiere die erste Bewerbung.
        </div>

        <div v-else class="relative w-full overflow-x-auto">
            <svg
                :viewBox="`0 0 ${totalWidth} ${totalHeight}`"
                preserveAspectRatio="xMidYMid meet"
                class="block w-full"
                :style="{ minWidth: '480px', maxWidth: '780px', marginInline: 'auto' }"
            >
                <g>
                    <path
                        v-for="(stage, i) in stages.slice(1)"
                        :key="`conn-${i}`"
                        :d="connectorPath(i + 1)"
                        :fill="stage.color"
                        fill-opacity="0.18"
                    />
                </g>

                <g>
                    <template v-for="(stage, i) in stages" :key="stage.key">
                        <rect
                            :x="geometries[i].x"
                            :y="geometries[i].yTop"
                            :width="BLOCK_WIDTH"
                            :height="geometries[i].height"
                            :fill="stage.color"
                            fill-opacity="0.85"
                            rx="6"
                        />
                        <text
                            :x="geometries[i].x + BLOCK_WIDTH / 2"
                            :y="LABEL_TOP - 16"
                            text-anchor="middle"
                            class="fill-jt-fg-muted"
                            style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em"
                        >
                            {{ stage.label }}
                        </text>
                        <text
                            :x="geometries[i].x + BLOCK_WIDTH / 2"
                            :y="LABEL_TOP - 2"
                            text-anchor="middle"
                            class="fill-jt-fg"
                            style="font-size: 18px; font-weight: 600"
                        >
                            {{ stage.value }}
                        </text>
                        <text
                            v-if="i > 0"
                            :x="geometries[i].x + BLOCK_WIDTH / 2"
                            :y="LABEL_TOP + CHART_HEIGHT + 22"
                            text-anchor="middle"
                            class="fill-jt-fg-soft"
                            style="font-size: 12px; font-weight: 600"
                        >
                            {{ conversionRates[i] }}%
                        </text>
                        <text
                            v-if="i > 0 && droppedCounts[i] > 0"
                            :x="geometries[i].x + BLOCK_WIDTH / 2"
                            :y="LABEL_TOP + CHART_HEIGHT + 40"
                            text-anchor="middle"
                            class="fill-jt-danger"
                            style="font-size: 10px"
                        >
                            −{{ droppedCounts[i] }}
                        </text>
                    </template>
                </g>
            </svg>
        </div>
    </div>
</template>
