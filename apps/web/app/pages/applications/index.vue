<script setup lang="ts">
import type { ApplicationStatus } from "@job-tracker/shared";

const t = useT();
const toast = useToast();
const store = useApplicationsStore();
const settingsStore = useSettingsStore();

useHead({ title: t.applications.title });

await Promise.all([store.fetchAll(), settingsStore.fetch()]);

type View = "kanban" | "list";
const view = ref<View>(settingsStore.data?.defaultView ?? "kanban");

const viewOptions = [
    { value: "kanban" as const, label: t.applications.viewKanban, icon: "i-lucide-columns-3" },
    { value: "list" as const, label: t.applications.viewList, icon: "i-lucide-list" },
];

const onMove = async (args: { applicationId: string; toStatus: ApplicationStatus }) => {
    try {
        await store.changeStatus(args.applicationId, { toStatus: args.toStatus });
        toast.success(t.toast.statusChanged);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};
</script>

<template>
    <div>
        <LayoutPageHeader :title="t.applications.title">
            <template #actions>
                <UiSegmented v-model="view" :options="viewOptions" />
                <UiButton
                    variant="brand"
                    icon="i-lucide-plus"
                    @click="navigateTo('/applications/new')"
                >
                    {{ t.applications.new }}
                </UiButton>
            </template>
        </LayoutPageHeader>

        <ApplicationFilters
            :model-value="store.filters"
            class="mb-4"
            @update:model-value="(v) => Object.assign(store.filters, v)"
        />

        <p class="mb-3 text-xs text-jt-fg-muted">
            {{ t.applications.countLabel(store.filtered.length) }}
        </p>

        <div v-if="store.loading && store.items.length === 0" class="flex justify-center py-10">
            <UiSpinner :label="t.common.loading" />
        </div>

        <UiEmptyState
            v-else-if="store.items.length === 0"
            icon="i-lucide-briefcase"
            :title="t.applications.empty"
            :description="t.applications.emptyHint"
            :action-label="t.applications.startImport"
            @action="navigateTo('/applications/new')"
        />

        <UiEmptyState
            v-else-if="store.filtered.length === 0"
            icon="i-lucide-filter-x"
            :title="t.common.empty"
            :description="t.applications.emptyHint"
        />

        <ApplicationKanbanBoard
            v-else-if="view === 'kanban'"
            :applications="store.filtered"
            @move="onMove"
        />

        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ApplicationListRow
                v-for="app in store.filtered"
                :key="app.id"
                :application="app"
            />
        </div>
    </div>
</template>
