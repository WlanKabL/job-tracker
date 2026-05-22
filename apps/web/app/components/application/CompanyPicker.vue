<script setup lang="ts">
import type { CompanyWithCount } from "~/composables/useApi";

interface Props {
    modelValue: string | null;
    label?: string;
    required?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    "update:modelValue": [companyId: string | null];
    "create-request": [name: string];
}>();

const t = useT();
const companiesStore = useCompaniesStore();
await companiesStore.fetchAll();

const open = ref(false);
const search = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

const selected = computed<CompanyWithCount | null>(() =>
    companiesStore.items.find((c) => c.id === props.modelValue) ?? null,
);

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return companiesStore.items.slice(0, 20);
    return companiesStore.items
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 20);
});

const showCreate = computed(() => {
    const q = search.value.trim();
    if (!q) return false;
    return !companiesStore.items.some((c) => c.name.toLowerCase() === q.toLowerCase());
});

const select = (companyId: string) => {
    emit("update:modelValue", companyId);
    open.value = false;
    search.value = "";
};

const createInline = async () => {
    const name = search.value.trim();
    if (!name) return;
    const created = await companiesStore.create({ name });
    emit("update:modelValue", created.id);
    open.value = false;
    search.value = "";
};

const close = () => {
    open.value = false;
    search.value = "";
};

watch(open, (v) => {
    if (v) nextTick(() => inputRef.value?.focus());
});
</script>

<template>
    <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-jt-fg-soft">
            {{ label ?? t.applicationForm.fields.companyName }}
            <span v-if="required" class="text-jt-danger">*</span>
        </label>
        <button
            type="button"
            class="flex items-center justify-between gap-2 rounded-md border border-jt-line bg-jt-surface px-3 py-2 text-left text-sm text-jt-fg"
            @click="open = true"
        >
            <span v-if="selected" class="truncate">{{ selected.name }}</span>
            <span v-else class="text-jt-fg-faint">— wählen —</span>
            <Icon name="i-lucide-chevron-down" class="h-4 w-4 text-jt-fg-muted" />
        </button>

        <UiModal :open="open" :title="label ?? t.applicationForm.fields.companyName" size="md" @close="close">
            <div class="flex flex-col gap-2">
                <input
                    ref="inputRef"
                    v-model="search"
                    type="text"
                    :placeholder="t.applicationForm.placeholders.companyName"
                    class="w-full rounded-md border border-jt-line bg-jt-surface px-3 py-2 text-sm focus:border-jt-brand focus:outline-none"
                    @keydown.enter.prevent="
                        showCreate ? createInline() : filtered[0] ? select(filtered[0].id) : null
                    "
                />
                <ul class="max-h-72 overflow-y-auto rounded-md border border-jt-line-faint">
                    <li
                        v-for="company in filtered"
                        :key="company.id"
                        class="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-jt-surface-hover"
                        @click="select(company.id)"
                    >
                        <span class="truncate">{{ company.name }}</span>
                        <span class="rounded bg-jt-surface px-1.5 py-0.5 text-xs text-jt-fg-muted">
                            {{ company.applicationCount }}
                        </span>
                    </li>
                    <li
                        v-if="filtered.length === 0 && !showCreate"
                        class="px-3 py-3 text-center text-sm text-jt-fg-muted"
                    >
                        {{ t.common.empty }}
                    </li>
                </ul>
                <button
                    v-if="showCreate"
                    type="button"
                    class="flex items-center gap-2 rounded-md border border-dashed border-jt-brand px-3 py-2 text-sm text-jt-brand hover:bg-jt-brand-soft"
                    @click="createInline"
                >
                    <Icon name="i-lucide-plus" class="h-4 w-4" />
                    „{{ search }}" anlegen
                </button>
            </div>
        </UiModal>
    </div>
</template>
