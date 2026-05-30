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

const activeCount = computed(
    () => props.modelValue.status.length + props.modelValue.source.length,
);
</script>

<template>
    <div class="flex flex-col gap-4 rounded-2xl border border-jt-line bg-jt-surface p-4">
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
                <span class="hidden sm:inline">Filter zurücksetzen</span>
                <span v-if="activeCount > 0" class="tabular text-jt-fg-faint">
                    ({{ activeCount }})
                </span>
            </UiButton>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <fieldset>
                <legend class="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-jt-fg-muted">
                    {{ t.applications.filterStatus }}
                </legend>
                <div class="flex flex-wrap gap-1.5">
                    <button
                        v-for="status in APPLICATION_STATUS"
                        :key="status"
                        type="button"
                        :class="[
                            'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition',
                            modelValue.status.includes(status)
                                ? 'border-jt-brand/40 bg-jt-brand-soft text-jt-brand'
                                : 'border-jt-line bg-jt-base text-jt-fg-muted hover:border-jt-fg-faint hover:text-jt-fg',
                        ]"
                        @click="toggleStatus(status)"
                    >
                        <span
                            :class="[
                                'h-1.5 w-1.5 rounded-full',
                                useStatusMeta(status).dotClass,
                            ]"
                        ></span>
                        {{ t.status[status] }}
                    </button>
                </div>
            </fieldset>

            <fieldset>
                <legend class="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-jt-fg-muted">
                    {{ t.applications.filterSource }}
                </legend>
                <div class="flex flex-wrap gap-1.5">
                    <button
                        v-for="source in APPLICATION_SOURCE"
                        :key="source"
                        type="button"
                        :class="[
                            'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition',
                            modelValue.source.includes(source)
                                ? 'border-jt-brand/40 bg-jt-brand-soft text-jt-brand'
                                : 'border-jt-line bg-jt-base text-jt-fg-muted hover:border-jt-fg-faint hover:text-jt-fg',
                        ]"
                        @click="toggleSource(source)"
                    >
                        <Icon :name="useSourceMeta(source).icon" class="h-3 w-3" />
                        {{ t.source[source] }}
                    </button>
                </div>
            </fieldset>
        </div>

        <div class="flex items-center justify-end border-t border-jt-line-faint pt-3">
            <UiCheckbox
                :model-value="modelValue.includeArchived"
                :label="t.applications.showArchived"
                @update:model-value="(v) => update('includeArchived', v)"
            />
        </div>
    </div>
</template>
