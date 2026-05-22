<script setup lang="ts">
import type { ApplicationStatus } from "@job-tracker/shared";
import { APPLICATION_STATUS, canTransition } from "@job-tracker/shared";

interface Props {
    current: ApplicationStatus;
    disabled?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ change: [args: { toStatus: ApplicationStatus; note?: string }] }>();

const t = useT();
const open = ref(false);
const note = ref("");
const selectedStatus = ref<ApplicationStatus | null>(null);

const candidates = computed(() =>
    APPLICATION_STATUS.filter((s) => s !== props.current && canTransition(props.current, s)),
);

const beginChange = (status: ApplicationStatus) => {
    selectedStatus.value = status;
    note.value = "";
};

const cancel = () => {
    selectedStatus.value = null;
    note.value = "";
};

const confirmChange = () => {
    if (!selectedStatus.value) return;
    emit("change", { toStatus: selectedStatus.value, note: note.value.trim() || undefined });
    selectedStatus.value = null;
    note.value = "";
    open.value = false;
};
</script>

<template>
    <div>
        <UiButton
            variant="outline"
            icon="i-lucide-arrow-right"
            :disabled="disabled || candidates.length === 0"
            @click="open = true"
        >
            {{ t.applicationDetail.statusChange.label }}
        </UiButton>

        <UiModal :open="open" :title="t.applicationDetail.statusChange.label" size="md" @close="open = false">
            <div v-if="!selectedStatus" class="flex flex-col gap-2">
                <p class="text-sm text-jt-fg-muted">
                    Aktuell: <UiStatusBadge :status="current" size="sm" />
                </p>
                <ul class="flex flex-col gap-1">
                    <li v-for="s in candidates" :key="s">
                        <button
                            type="button"
                            class="flex w-full items-center justify-between gap-3 rounded-md border border-jt-line bg-jt-surface px-3 py-2 text-left transition hover:border-jt-brand"
                            @click="beginChange(s)"
                        >
                            <UiStatusBadge :status="s" size="sm" />
                            <Icon name="i-lucide-arrow-right" class="h-4 w-4 text-jt-fg-muted" />
                        </button>
                    </li>
                </ul>
                <p v-if="candidates.length === 0" class="text-sm italic text-jt-fg-muted">
                    {{ t.applicationDetail.statusChange.invalidTransition }}
                </p>
            </div>

            <div v-else class="flex flex-col gap-3">
                <div class="flex items-center gap-2 text-sm">
                    <UiStatusBadge :status="current" size="sm" />
                    <Icon name="i-lucide-arrow-right" class="h-4 w-4 text-jt-fg-muted" />
                    <UiStatusBadge :status="selectedStatus" size="sm" />
                </div>
                <UiTextarea
                    v-model="note"
                    :label="t.applicationDetail.statusChange.note"
                    :rows="3"
                />
            </div>

            <template #footer>
                <UiButton v-if="selectedStatus" variant="ghost" @click="cancel">
                    {{ t.common.cancel }}
                </UiButton>
                <UiButton v-if="selectedStatus" variant="brand" @click="confirmChange">
                    {{ t.applicationDetail.statusChange.submit }}
                </UiButton>
            </template>
        </UiModal>
    </div>
</template>
