<script setup lang="ts">
import type { FunnelData, FunnelStageData } from "@job-tracker/shared";

interface Props {
    funnel: FunnelData;
}

const props = defineProps<Props>();
const t = useT();

const STAGE_LABEL: Record<FunnelStageData["key"], string> = {
    applied: t.status.applied,
    phone: t.status.phone,
    interview: t.status.interview,
    offer: t.status.offer,
};

interface StageGeometry {
    key: FunnelStageData["key"];
    label: string;
    data: FunnelStageData;
    x: number;
    yTop: number;
    yBottom: number;
    height: number;
    activeHeight: number;
    continuedHeight: number;
    rejectedHeight: number;
    withdrawnHeight: number;
    ghostedHeight: number;
}

const BLOCK_WIDTH = 92;
const GAP = 84;
const TOP_PAD = 40;
const CHART_HEIGHT = 220;
const BOTTOM_PAD = 92;
const STAGES = computed(() => props.funnel.stages);

const totalReached = computed(() => Math.max(1, STAGES.value[0]?.reached ?? 0));

const geos = computed<StageGeometry[]>(() => {
    return STAGES.value.map((stage, i) => {
        const ratio = stage.reached / totalReached.value;
        const height = ratio * CHART_HEIGHT;
        const yTop = TOP_PAD + (CHART_HEIGHT - height) / 2;
        const yBottom = yTop + height;
        const safe = stage.reached || 1;
        const activeHeight = (stage.active / safe) * height;
        const continuedHeight = (stage.continued / safe) * height;
        const rejectedHeight = (stage.dropped.rejected / safe) * height;
        const withdrawnHeight = (stage.dropped.withdrawn / safe) * height;
        const ghostedHeight = (stage.dropped.ghosted / safe) * height;
        return {
            key: stage.key,
            label: STAGE_LABEL[stage.key],
            data: stage,
            x: i * (BLOCK_WIDTH + GAP),
            yTop,
            yBottom,
            height,
            activeHeight,
            continuedHeight,
            rejectedHeight,
            withdrawnHeight,
            ghostedHeight,
        };
    });
});

const totalWidth = computed(
    () => STAGES.value.length * BLOCK_WIDTH + (STAGES.value.length - 1) * GAP,
);
const svgHeight = TOP_PAD + CHART_HEIGHT + BOTTOM_PAD;

/** Bezier path connecting the continued portion of stage[i] to stage[i+1]. */
const continuedPath = (i: number): string => {
    if (i === STAGES.value.length - 1) return "";
    const prev = geos.value[i]!;
    const cur = geos.value[i + 1]!;
    if (prev.continuedHeight === 0 || cur.height === 0) return "";
    const x1 = prev.x + BLOCK_WIDTH;
    const x2 = cur.x;
    const cpx = (x1 + x2) / 2;
    // Continued portion is in the TOP slice of the prev block (above dropped+active? no — split below)
    // We layer: top=continued (visualizing "left the stage going forward"), middle=active, bottom=dropped
    const prevTop = prev.yTop;
    const prevBottom = prev.yTop + prev.continuedHeight;
    return `M ${x1} ${prevTop} C ${cpx} ${prevTop} ${cpx} ${cur.yTop} ${x2} ${cur.yTop} L ${x2} ${cur.yBottom} C ${cpx} ${cur.yBottom} ${cpx} ${prevBottom} ${x1} ${prevBottom} Z`;
};

const totalConversion = computed(() => {
    const first = STAGES.value[0]?.reached ?? 0;
    const last = STAGES.value[STAGES.value.length - 1]?.reached ?? 0;
    if (first === 0) return 0;
    return Math.round((last / first) * 100);
});

const conversionRate = (i: number): number => {
    if (i === 0) return 100;
    const prev = STAGES.value[i - 1]?.reached ?? 0;
    const cur = STAGES.value[i]?.reached ?? 0;
    if (prev === 0) return 0;
    return Math.round((cur / prev) * 100);
};

const isEmpty = computed(() => totalReached.value <= 1 && STAGES.value[0]?.reached === 0);
</script>

<template>
    <section class="rounded-xl border border-jt-line bg-jt-surface p-5">
        <header class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
                <h3 class="text-sm font-semibold text-jt-fg">Funnel</h3>
                <p class="text-xs text-jt-fg-muted">
                    Wohin fließen deine Bewerbungen — pro Stufe Aktiv vs. Drop-Off.
                </p>
            </div>
            <div v-if="!isEmpty" class="text-right">
                <div class="text-2xl font-semibold text-jt-fg tabular-nums">
                    {{ totalConversion }}%
                </div>
                <div class="text-[11px] uppercase tracking-wide text-jt-fg-muted">
                    {{ STAGES[0]?.reached }} Beworben → {{ STAGES[STAGES.length - 1]?.reached }} Angebot
                </div>
            </div>
        </header>

        <div v-if="isEmpty" class="flex h-48 items-center justify-center text-sm italic text-jt-fg-faint">
            Noch keine Bewerbungen — importiere die erste Bewerbung.
        </div>

        <div v-else class="relative w-full overflow-x-auto">
            <div class="mb-3 flex flex-wrap items-center gap-3 text-[11px] text-jt-fg-muted">
                <span class="inline-flex items-center gap-1.5">
                    <span class="h-2 w-3 rounded-sm bg-jt-info"></span>Weiter
                </span>
                <span class="inline-flex items-center gap-1.5">
                    <span class="h-2 w-3 rounded-sm bg-jt-brand"></span>Aktiv hier
                </span>
                <span class="inline-flex items-center gap-1.5">
                    <span class="h-2 w-3 rounded-sm bg-jt-danger"></span>Abgesagt
                </span>
                <span class="inline-flex items-center gap-1.5">
                    <span class="h-2 w-3 rounded-sm bg-jt-fg-muted"></span>Zurückgezogen
                </span>
                <span class="inline-flex items-center gap-1.5">
                    <span class="h-2 w-3 rounded-sm bg-jt-fg-faint"></span>Geghostet
                </span>
            </div>

            <svg
                :viewBox="`0 0 ${totalWidth} ${svgHeight}`"
                preserveAspectRatio="xMidYMid meet"
                class="block w-full"
                :style="{ minWidth: '520px', maxWidth: '820px', marginInline: 'auto' }"
            >
                <!-- Connectors between stages (drawn first, behind blocks) -->
                <g>
                    <path
                        v-for="(_, i) in STAGES"
                        :key="`conn-${i}`"
                        :d="continuedPath(i)"
                        fill="var(--jt-info)"
                        fill-opacity="0.22"
                    />
                </g>

                <!-- Stage blocks: stacked top→bottom as continued | active | rejected | withdrawn | ghosted -->
                <g>
                    <template v-for="(g, i) in geos" :key="g.key">
                        <!-- Continued (top, info color) -->
                        <rect
                            v-if="g.continuedHeight > 0"
                            :x="g.x"
                            :y="g.yTop"
                            :width="BLOCK_WIDTH"
                            :height="g.continuedHeight"
                            fill="var(--jt-info)"
                            fill-opacity="0.55"
                            :rx="4"
                        />
                        <!-- Active (brand) -->
                        <rect
                            v-if="g.activeHeight > 0"
                            :x="g.x"
                            :y="g.yTop + g.continuedHeight"
                            :width="BLOCK_WIDTH"
                            :height="g.activeHeight"
                            fill="var(--jt-brand)"
                            fill-opacity="0.85"
                        />
                        <!-- Rejected (danger) -->
                        <rect
                            v-if="g.rejectedHeight > 0"
                            :x="g.x"
                            :y="g.yTop + g.continuedHeight + g.activeHeight"
                            :width="BLOCK_WIDTH"
                            :height="g.rejectedHeight"
                            fill="var(--jt-danger)"
                            fill-opacity="0.75"
                        />
                        <!-- Withdrawn (muted) -->
                        <rect
                            v-if="g.withdrawnHeight > 0"
                            :x="g.x"
                            :y="g.yTop + g.continuedHeight + g.activeHeight + g.rejectedHeight"
                            :width="BLOCK_WIDTH"
                            :height="g.withdrawnHeight"
                            fill="var(--jt-fg-muted)"
                            fill-opacity="0.55"
                        />
                        <!-- Ghosted (faint) -->
                        <rect
                            v-if="g.ghostedHeight > 0"
                            :x="g.x"
                            :y="g.yTop + g.continuedHeight + g.activeHeight + g.rejectedHeight + g.withdrawnHeight"
                            :width="BLOCK_WIDTH"
                            :height="g.ghostedHeight"
                            fill="var(--jt-fg-faint)"
                            fill-opacity="0.55"
                            :rx="4"
                        />

                        <!-- Stage label above -->
                        <text
                            :x="g.x + BLOCK_WIDTH / 2"
                            :y="TOP_PAD - 22"
                            text-anchor="middle"
                            class="fill-jt-fg-muted"
                            style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em"
                        >
                            {{ g.label }}
                        </text>
                        <text
                            :x="g.x + BLOCK_WIDTH / 2"
                            :y="TOP_PAD - 6"
                            text-anchor="middle"
                            class="fill-jt-fg"
                            style="font-size: 20px; font-weight: 600"
                        >
                            {{ g.data.reached }}
                        </text>

                        <!-- Below stage: conversion + drop breakdown -->
                        <text
                            v-if="i > 0"
                            :x="g.x + BLOCK_WIDTH / 2"
                            :y="TOP_PAD + CHART_HEIGHT + 22"
                            text-anchor="middle"
                            class="fill-jt-fg-soft"
                            style="font-size: 12px; font-weight: 600"
                        >
                            {{ conversionRate(i) }}%
                        </text>

                        <!-- Drop breakdown text -->
                        <g
                            v-if="g.data.dropped.total > 0"
                            :transform="`translate(${g.x + BLOCK_WIDTH / 2}, ${TOP_PAD + CHART_HEIGHT + 42})`"
                        >
                            <text
                                v-if="g.data.dropped.rejected > 0"
                                text-anchor="middle"
                                y="0"
                                class="fill-jt-danger"
                                style="font-size: 10px"
                            >
                                {{ g.data.dropped.rejected }} abgesagt
                            </text>
                            <text
                                v-if="g.data.dropped.withdrawn > 0"
                                text-anchor="middle"
                                :y="g.data.dropped.rejected > 0 ? 12 : 0"
                                class="fill-jt-fg-muted"
                                style="font-size: 10px"
                            >
                                {{ g.data.dropped.withdrawn }} zurückgezogen
                            </text>
                            <text
                                v-if="g.data.dropped.ghosted > 0"
                                text-anchor="middle"
                                :y="
                                    (g.data.dropped.rejected > 0 ? 12 : 0) +
                                    (g.data.dropped.withdrawn > 0 ? 12 : 0)
                                "
                                class="fill-jt-fg-faint"
                                style="font-size: 10px"
                            >
                                {{ g.data.dropped.ghosted }} geghostet
                            </text>
                        </g>
                    </template>
                </g>
            </svg>
        </div>
    </section>
</template>
