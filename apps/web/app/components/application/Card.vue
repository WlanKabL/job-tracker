<script setup lang="ts">
import type { ApplicationWithCompany } from "~/composables/useApi";

interface Props {
    application: ApplicationWithCompany;
    draggable?: boolean;
}

const props = defineProps<Props>();
const t = useT();

const onDragStart = (event: DragEvent) => {
    if (!props.draggable) return;
    event.dataTransfer?.setData("text/plain", props.application.id);
    event.dataTransfer!.effectAllowed = "move";
};

const appliedLabel = computed(() => formatRelative(props.application.appliedAt ?? props.application.createdAt));
</script>

<template>
    <NuxtLink
        :to="`/applications/${application.id}`"
        :draggable="draggable"
        class="flex flex-col gap-2 rounded-lg border border-jt-line bg-jt-base p-3 text-left transition hover:border-jt-fg-faint hover:shadow-md cursor-grab active:cursor-grabbing"
        @dragstart="onDragStart"
    >
        <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-jt-fg">{{ application.position }}</h3>
                <p class="truncate text-xs text-jt-fg-muted">
                    {{ application.company?.name ?? t.common.unknown }}
                </p>
            </div>
            <UiSourceBadge :source="application.source" size="sm" />
        </div>
        <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-jt-fg-muted">
            <span v-if="application.location">{{ application.location }}</span>
            <span v-if="application.workMode">· {{ t.workMode[application.workMode] }}</span>
            <span class="ml-auto whitespace-nowrap">{{ appliedLabel }}</span>
        </div>
    </NuxtLink>
</template>
