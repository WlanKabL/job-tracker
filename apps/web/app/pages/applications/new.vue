<script setup lang="ts">
import type { Application } from "@job-tracker/shared";

const t = useT();
useHead({ title: t.applicationNew.title });

type Tab = "import" | "manual";
const tab = ref<Tab>("import");

const tabs = computed(() => [
    { id: "import" as Tab, label: t.applicationNew.tabImport, icon: "i-lucide-clipboard-paste" },
    { id: "manual" as Tab, label: t.applicationNew.tabManual, icon: "i-lucide-pencil" },
]);

const onDone = (application: Application) => {
    navigateTo(`/applications/${application.id}`);
};
</script>

<template>
    <div class="mx-auto max-w-3xl">
        <LayoutPageHeader
            :title="t.applicationNew.title"
            :subtitle="t.applicationNew.subtitle"
            back-to="/applications"
        />

        <UiTabs :model-value="tab" :tabs="tabs" class="mb-4" @update:model-value="(id) => (tab = id as Tab)" />

        <UiCard>
            <ApplicationImportForm v-if="tab === 'import'" @done="onDone" />
            <ApplicationManualForm v-else @done="onDone" />
        </UiCard>
    </div>
</template>
