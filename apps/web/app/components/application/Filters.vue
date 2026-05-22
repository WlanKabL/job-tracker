<script setup lang="ts">
import type { ApplicationSource, ApplicationStatus } from "@job-tracker/shared";
import { APPLICATION_SOURCE, APPLICATION_STATUS } from "@job-tracker/shared";

interface ModelValue {
    status: ApplicationStatus[];
    source: ApplicationSource[];
    search: string;
    includeArchived: boolean;
}

interface Props {
    modelValue: ModelValue;
}

const props = defineProps<Props>();
const emit = defineEmits<{ "update:modelValue": [v: ModelValue] }>();
const t = useT();

const update = <K extends keyof ModelValue>(key: K, value: ModelValue[K]) => {
    emit("update:modelValue", { ...props.modelValue, [key]: value });
};

const toggleStatus = (status: ApplicationStatus) => {
    const next = props.modelValue.status.includes(status)
        ? props.modelValue.status.filter((s) => s !== status)
        : [...props.modelValue.status, status];
    update("status", next);
};

const toggleSource = (source: ApplicationSource) => {
    const next = props.modelValue.source.includes(source)
        ? props.modelValue.source.filter((s) => s !== source)
        : [...props.modelValue.source, source];
    update("source", next);
};

const reset = () => {
    emit("update:modelValue", { status: [], source: [], search: "", includeArchived: false });
};

const hasFilters = computed(
    () =>
        props.modelValue.status.length > 0 ||
        props.modelValue.source.length > 0 ||
        props.modelValue.search.length > 0 ||
        props.modelValue.includeArchived,
);
</script>

<template>
    <div class="flex flex-col gap-3 rounded-xl border border-jt-line bg-jt-surface p-3">
        <div class="flex items-center gap-2">
            <UiTextInput
                :model-value="modelValue.search"
                :placeholder="t.applications.searchPlaceholder"
                icon="i-lucide-search"
                class="flex-1"
                @update:model-value="(v) => update('search', v)"
            />
            <UiButton
                v-if="hasFilters"
                variant="ghost"
                size="sm"
                icon="i-lucide-x"
                @click="reset"
            >
                Reset
            </UiButton>
        </div>
        <div class="flex flex-wrap gap-3">
            <fieldset class="flex flex-wrap items-center gap-1.5">
                <legend class="mr-2 text-xs uppercase tracking-wide text-jt-fg-muted">
                    {{ t.applications.filterStatus }}
                </legend>
                <button
                    v-for="status in APPLICATION_STATUS"
                    :key="status"
                    type="button"
                    :class="[
                        'rounded-md border px-2 py-0.5 text-xs transition',
                        modelValue.status.includes(status)
                            ? 'border-jt-brand bg-jt-brand-soft text-jt-brand'
                            : 'border-jt-line text-jt-fg-muted hover:text-jt-fg',
                    ]"
                    @click="toggleStatus(status)"
                >
                    {{ t.status[status] }}
                </button>
            </fieldset>
        </div>
        <div class="flex flex-wrap gap-3">
            <fieldset class="flex flex-wrap items-center gap-1.5">
                <legend class="mr-2 text-xs uppercase tracking-wide text-jt-fg-muted">
                    {{ t.applications.filterSource }}
                </legend>
                <button
                    v-for="source in APPLICATION_SOURCE"
                    :key="source"
                    type="button"
                    :class="[
                        'rounded-md border px-2 py-0.5 text-xs transition',
                        modelValue.source.includes(source)
                            ? 'border-jt-brand bg-jt-brand-soft text-jt-brand'
                            : 'border-jt-line text-jt-fg-muted hover:text-jt-fg',
                    ]"
                    @click="toggleSource(source)"
                >
                    {{ t.source[source] }}
                </button>
            </fieldset>
            <UiCheckbox
                :model-value="modelValue.includeArchived"
                :label="t.applications.showArchived"
                class="ml-auto"
                @update:model-value="(v) => update('includeArchived', v)"
            />
        </div>
    </div>
</template>
