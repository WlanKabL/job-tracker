<script setup lang="ts">
const t = useT();
const api = useApi();

const { data, pending, error } = await useAsyncData("prompts", () => api.prompts.get());

const promptList = computed(() =>
    [
        { key: "extract" as const, icon: "i-lucide-clipboard-paste", ...t.prompts.sections.extract },
        { key: "successProbability" as const, icon: "i-lucide-target", ...t.prompts.sections.successProbability },
        { key: "cheatsheet" as const, icon: "i-lucide-notebook-text", ...t.prompts.sections.cheatsheet },
        { key: "coverLetter" as const, icon: "i-lucide-mail", ...t.prompts.sections.coverLetter },
        { key: "followUp" as const, icon: "i-lucide-message-circle-reply", ...t.prompts.sections.followUp },
        { key: "salary" as const, icon: "i-lucide-banknote", ...t.prompts.sections.salary },
    ].map((section) => ({
        ...section,
        template: data.value?.prompts[section.key].template ?? "",
    })),
);

useHead({ title: t.prompts.title });
</script>

<template>
    <div class="mx-auto max-w-4xl">
        <LayoutPageHeader :title="t.prompts.title" :subtitle="t.prompts.subtitle">
            <template #actions>
                <UiButton variant="outline" icon="i-lucide-plus" @click="navigateTo('/applications/new')">
                    {{ t.nav.newApplication }}
                </UiButton>
            </template>
        </LayoutPageHeader>

        <div v-if="pending" class="flex justify-center py-10">
            <UiSpinner :label="t.common.loading" />
        </div>
        <div v-else-if="error" class="text-jt-danger">
            {{ t.errors.title }}
        </div>
        <div v-else class="flex flex-col gap-5">
            <div
                class="flex items-start gap-3 rounded-xl border border-jt-info/30 bg-jt-info-soft p-4 text-sm text-jt-info"
            >
                <Icon name="i-lucide-info" class="mt-0.5 h-4 w-4 shrink-0" />
                <span>{{ t.prompts.memoryHint }}</span>
            </div>
            <UiCard v-for="section in promptList" :key="section.key">
                <header class="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div class="flex items-start gap-3">
                        <div
                            class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-jt-brand-soft text-jt-brand"
                        >
                            <Icon :name="section.icon" class="h-5 w-5" />
                        </div>
                        <div>
                            <h2 class="text-lg font-semibold text-jt-fg">{{ section.title }}</h2>
                            <p class="mt-1 text-sm text-jt-fg-muted">{{ section.description }}</p>
                        </div>
                    </div>
                    <UiCopyButton :text="section.template" variant="brand" size="sm" icon="i-lucide-copy">
                        {{ t.prompts.copyPrompt }}
                    </UiCopyButton>
                </header>
                <pre
                    class="max-h-[420px] overflow-auto rounded-md border border-jt-line bg-jt-surface px-3 py-3 font-mono text-xs leading-relaxed text-jt-fg-soft whitespace-pre-wrap break-words"
                >{{ section.template }}</pre>
            </UiCard>
        </div>
    </div>
</template>
