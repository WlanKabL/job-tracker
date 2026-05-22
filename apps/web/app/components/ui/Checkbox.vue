<script setup lang="ts">
interface Props {
    modelValue: boolean;
    label?: string;
    disabled?: boolean;
}

defineProps<Props>();
const emit = defineEmits<{ "update:modelValue": [v: boolean] }>();
</script>

<template>
    <label
        class="inline-flex cursor-pointer items-center gap-2 text-sm text-jt-fg select-none"
        :class="{ 'cursor-not-allowed opacity-60': disabled }"
    >
        <input
            type="checkbox"
            :checked="modelValue"
            :disabled="disabled"
            class="h-4 w-4 rounded border-jt-line bg-jt-surface text-jt-brand focus:ring-jt-brand"
            @change="(e) => emit('update:modelValue', (e.target as HTMLInputElement).checked)"
        />
        <span v-if="label">{{ label }}</span>
        <slot />
    </label>
</template>
