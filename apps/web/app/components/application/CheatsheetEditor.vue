<script setup lang="ts">
interface Props {
    modelValue: string;
    dirty: boolean;
}

defineProps<Props>();
const emit = defineEmits<{
    "update:modelValue": [v: string];
    save: [];
}>();

const t = useT();
type Mode = "edit" | "preview" | "split";
const mode = ref<Mode>("split");

const update = (v: string) => emit("update:modelValue", v);

const save = () => emit("save");

const modeOptions = [
    { value: "edit" as const, label: "Edit", icon: "i-lucide-pencil" },
    { value: "split" as const, label: "Split", icon: "i-lucide-columns-2" },
    { value: "preview" as const, label: "Preview", icon: "i-lucide-eye" },
];
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-2">
            <UiSegmented v-model="mode" :options="modeOptions" />
            <UiButton
                variant="brand"
                size="sm"
                icon="i-lucide-save"
                :disabled="!dirty"
                @click="save"
            >
                {{ t.common.save }}
            </UiButton>
        </div>
        <div
            :class="[
                'grid gap-3',
                mode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1',
            ]"
        >
            <UiTextarea
                v-if="mode !== 'preview'"
                :model-value="modelValue"
                :rows="20"
                monospace
                @update:model-value="update"
            />
            <div
                v-if="mode !== 'edit'"
                class="rounded-md border border-jt-line bg-jt-surface p-4"
            >
                <UiMarkdown :source="modelValue" />
            </div>
        </div>
    </div>
</template>
