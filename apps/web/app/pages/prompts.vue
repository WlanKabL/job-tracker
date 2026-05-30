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
    ].map((section, idx) => ({
        ...section,
        template: data.value?.prompts[section.key].template ?? "",
        index: idx + 1,
    })),
);

useHead({ title: t.prompts.title });
</script>

<template>
    <div class="mx-auto max-w-4xl">
        <LayoutPageHeader
            eyebrow="ChatGPT Bibliothek"
            :title="t.prompts.title"
            :subtitle="t.prompts.subtitle"
        >
            <template #actions>
                <UiButton variant="brand" icon="i-lucide-plus" @click="navigateTo('/applications/new')">
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
        <div v-else class="flex flex-col gap-4">
            <div
                class="jt-enter jt-enter-d100 flex items-start gap-3 rounded-2xl border border-jt-info/30 bg-jt-info-soft p-4 text-sm text-jt-info"
            >
                <Icon name="i-lucide-info" class="mt-0.5 h-4 w-4 shrink-0" />
                <span class="leading-relaxed">{{ t.prompts.memoryHint }}</span>
            </div>
            <section
                v-for="section in promptList"
                :key="section.key"
                class="jt-enter overflow-hidden rounded-2xl border border-jt-line bg-jt-surface"
            >
                <header class="flex flex-wrap items-start justify-between gap-3 border-b border-jt-line-faint px-5 py-4">
                    <div class="flex items-start gap-3">
                        <div
                            class="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-jt-brand-soft text-jt-brand"
                        >
                            <span class="absolute inset-0 bg-jt-brand-gradient opacity-[0.08]"></span>
                            <Icon :name="section.icon" class="relative z-10 h-5 w-5" />
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-[10px] uppercase tracking-[0.18em] text-jt-fg-faint">
                                    {{ String(section.index).padStart(2, "0") }}
                                </span>
                                <h2 class="font-display text-lg leading-snug text-jt-fg">
                                    {{ section.title }}
                                </h2>
                            </div>
                            <p class="mt-1 max-w-2xl text-sm leading-relaxed text-jt-fg-muted">
                                {{ section.description }}
                            </p>
                        </div>
                    </div>
                    <UiCopyButton :text="section.template" variant="brand" size="sm" icon="i-lucide-copy">
                        {{ t.prompts.copyPrompt }}
                    </UiCopyButton>
                </header>
                <pre
                    class="max-h-[420px] overflow-auto bg-jt-base px-5 py-4 font-mono text-[12px] leading-relaxed text-jt-fg-soft whitespace-pre-wrap break-words"
                >{{ section.template }}</pre>
            </section>
        </div>
    </div>
</template>
