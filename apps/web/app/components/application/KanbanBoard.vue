<script setup lang="ts">
import type { ApplicationStatus } from "@job-tracker/shared";
import { APPLICATION_STATUS, canTransition } from "@job-tracker/shared";
import type { ApplicationWithCompany } from "~/composables/useApi";

interface Props {
    applications: ApplicationWithCompany[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
    move: [args: { applicationId: string; toStatus: ApplicationStatus }];
}>();

const t = useT();

const columns = computed(() =>
    APPLICATION_STATUS.map((status) => ({
        status,
        meta: useStatusMeta(status),
        items: props.applications.filter((a) => a.status === status),
    })),
);

const draggingOver = ref<ApplicationStatus | null>(null);

const onDrop = (event: DragEvent, toStatus: ApplicationStatus) => {
    event.preventDefault();
    draggingOver.value = null;
    const applicationId = event.dataTransfer?.getData("text/plain");
    if (!applicationId) return;
    const app = props.applications.find((a) => a.id === applicationId);
    if (!app || app.status === toStatus) return;
    if (!canTransition(app.status, toStatus)) return;
    emit("move", { applicationId, toStatus });
};

const onDragOver = (event: DragEvent, toStatus: ApplicationStatus) => {
    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";
    draggingOver.value = toStatus;
};

const onDragLeave = () => {
    draggingOver.value = null;
};
</script>

<template>
    <div class="flex gap-3 overflow-x-auto pb-4">
        <section
            v-for="col in columns"
            :key="col.status"
            :class="[
                'flex w-72 shrink-0 flex-col rounded-xl border bg-jt-surface/50 transition',
                draggingOver === col.status
                    ? 'border-jt-brand bg-jt-brand-soft'
                    : 'border-jt-line',
            ]"
            @dragover="(e) => onDragOver(e, col.status)"
            @dragleave="onDragLeave"
            @drop="(e) => onDrop(e, col.status)"
        >
            <header class="flex items-center justify-between gap-2 border-b border-jt-line-faint px-3 py-2.5">
                <div class="flex items-center gap-2">
                    <span :class="['h-2 w-2 rounded-full', col.meta.dotClass]" />
                    <h3 class="text-sm font-medium text-jt-fg">{{ col.meta.label }}</h3>
                </div>
                <span class="rounded bg-jt-surface px-1.5 py-0.5 text-xs text-jt-fg-muted">
                    {{ col.items.length }}
                </span>
            </header>
            <div class="flex flex-1 flex-col gap-2 p-2 min-h-[120px]">
                <ApplicationCard
                    v-for="item in col.items"
                    :key="item.id"
                    :application="item"
                    draggable
                />
                <p v-if="col.items.length === 0" class="px-2 py-4 text-center text-xs text-jt-fg-faint">
                    —
                </p>
            </div>
        </section>
    </div>
</template>
