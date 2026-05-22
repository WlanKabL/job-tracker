<script setup lang="ts">
import type { Company } from "@job-tracker/shared";

interface IncomingCompany {
    name: string;
    website?: string;
    industry?: string;
    location?: string;
}

interface Props {
    open: boolean;
    incomingCompany: IncomingCompany | null;
    existingCompany: Company | null;
}

defineProps<Props>();

const emit = defineEmits<{
    close: [];
    reuse: [companyId: string];
    createNew: [];
}>();

const t = useT();
</script>

<template>
    <UiModal
        :open="open"
        :title="t.applicationNew.companyResolver.title"
        size="md"
        @close="emit('close')"
    >
        <p class="mb-4 text-sm text-jt-fg-soft">
            {{
                incomingCompany
                    ? t.applicationNew.companyResolver.subtitle(incomingCompany.name)
                    : ""
            }}
        </p>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
                type="button"
                class="flex flex-col gap-1 rounded-lg border border-jt-line bg-jt-surface p-4 text-left transition hover:border-jt-brand hover:bg-jt-brand-soft"
                @click="existingCompany && emit('reuse', existingCompany.id)"
            >
                <span class="text-xs uppercase tracking-wide text-jt-fg-muted">
                    {{ t.applicationNew.companyResolver.reuse }}
                </span>
                <span class="text-base font-semibold text-jt-fg">
                    {{ existingCompany?.name }}
                </span>
                <span v-if="existingCompany?.location" class="text-xs text-jt-fg-muted">
                    {{ existingCompany.location }}
                </span>
                <span class="mt-2 text-xs text-jt-fg-muted">
                    {{ t.applicationNew.companyResolver.reuseHint }}
                </span>
            </button>

            <button
                type="button"
                class="flex flex-col gap-1 rounded-lg border border-jt-line bg-jt-surface p-4 text-left transition hover:border-jt-brand hover:bg-jt-brand-soft"
                @click="emit('createNew')"
            >
                <span class="text-xs uppercase tracking-wide text-jt-fg-muted">
                    {{ t.applicationNew.companyResolver.createNew }}
                </span>
                <span class="text-base font-semibold text-jt-fg">
                    {{ incomingCompany?.name }}
                </span>
                <span v-if="incomingCompany?.location" class="text-xs text-jt-fg-muted">
                    {{ incomingCompany.location }}
                </span>
                <span class="mt-2 text-xs text-jt-fg-muted">
                    {{ t.applicationNew.companyResolver.createNewHint }}
                </span>
            </button>
        </div>

        <template #footer>
            <UiButton variant="ghost" @click="emit('close')">{{ t.common.cancel }}</UiButton>
        </template>
    </UiModal>
</template>
