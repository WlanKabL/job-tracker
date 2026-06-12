<script setup lang="ts">
import type { ExportFormat, ExportPreset } from "@job-tracker/shared";

interface Props {
    open: boolean;
}

defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const t = useT();
const toast = useToast();

const preset = ref<ExportPreset>("afa");
const format = ref<ExportFormat>("xlsx");
const from = ref("");
const to = ref("");
const includeArchived = ref(false);

const presetOptions = [
    { value: "afa" as const, label: t.applications.export.presetAfa },
    { value: "full" as const, label: t.applications.export.presetFull },
];

const formatOptions = [
    { value: "xlsx" as const, label: t.applications.export.formatXlsx },
    { value: "csv" as const, label: t.applications.export.formatCsv },
    { value: "pdf" as const, label: t.applications.export.formatPdf },
];

const rangeError = computed(() =>
    from.value && to.value && from.value > to.value ? t.applications.export.invalidRange : "",
);

const download = () => {
    if (rangeError.value) return;
    const params = new URLSearchParams({ format: format.value, preset: preset.value });
    if (from.value) params.set("from", from.value);
    if (to.value) params.set("to", to.value);
    if (preset.value === "full" && includeArchived.value) {
        params.set("includeArchived", "true");
    }
    const a = document.createElement("a");
    a.href = `/api/export/applications?${params.toString()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(t.applications.export.started);
    emit("close");
};
</script>

<template>
    <UiModal :open="open" :title="t.applications.export.title" size="md" @close="emit('close')">
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
                <span class="text-xs font-medium text-jt-fg-soft">
                    {{ t.applications.export.preset }}
                </span>
                <UiSegmented v-model="preset" :options="presetOptions" />
                <p class="text-xs text-jt-fg-muted">
                    {{
                        preset === "afa"
                            ? t.applications.export.presetAfaHint
                            : t.applications.export.presetFullHint
                    }}
                </p>
            </div>
            <div class="flex flex-col gap-1.5">
                <span class="text-xs font-medium text-jt-fg-soft">
                    {{ t.applications.export.format }}
                </span>
                <UiSegmented v-model="format" :options="formatOptions" />
            </div>
            <div>
                <div class="grid grid-cols-2 gap-3">
                    <UiTextInput
                        v-model="from"
                        type="date"
                        :label="t.applications.export.from"
                        :error="rangeError"
                    />
                    <UiTextInput v-model="to" type="date" :label="t.applications.export.to" />
                </div>
                <p class="mt-1 text-xs text-jt-fg-muted">
                    {{ t.applications.export.rangeHint }}
                </p>
            </div>
            <UiCheckbox
                v-if="preset === 'full'"
                v-model="includeArchived"
                :label="t.applications.export.includeArchived"
            />
        </div>
        <template #footer>
            <UiButton variant="ghost" @click="emit('close')">
                {{ t.common.cancel }}
            </UiButton>
            <UiButton
                variant="brand"
                icon="i-lucide-download"
                :disabled="!!rangeError"
                @click="download"
            >
                {{ t.applications.export.submit }}
            </UiButton>
        </template>
    </UiModal>
</template>
