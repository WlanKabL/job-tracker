<script setup lang="ts">
interface Props {
    modelValue: boolean;
    label?: string;
    disabled?: boolean;
    description?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ "update:modelValue": [v: boolean] }>();

const toggle = () => {
    if (props.disabled) return;
    emit("update:modelValue", !props.modelValue);
};
</script>

<template>
    <button
        type="button"
        :aria-pressed="modelValue"
        :disabled="disabled"
        class="flex w-full items-center justify-between gap-3 rounded-md p-2 text-left hover:bg-jt-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
        @click="toggle"
    >
        <span class="flex flex-col">
            <span v-if="label" class="text-sm text-jt-fg">{{ label }}</span>
            <span v-if="description" class="text-xs text-jt-fg-muted">{{ description }}</span>
        </span>
        <span
            :class="[
                'inline-flex h-5 w-9 items-center rounded-full px-0.5 transition',
                modelValue ? 'bg-jt-brand' : 'bg-jt-line',
            ]"
        >
            <span
                :class="[
                    'h-4 w-4 transform rounded-full bg-white shadow transition',
                    modelValue ? 'translate-x-4' : 'translate-x-0',
                ]"
            />
        </span>
    </button>
</template>
