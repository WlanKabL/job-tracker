<script setup lang="ts" generic="T extends string">
interface Option {
    value: T;
    label: string;
    icon?: string;
}

interface Props {
    modelValue: T;
    options: Option[];
}

defineProps<Props>();
const emit = defineEmits<{ "update:modelValue": [v: T] }>();
</script>

<template>
    <div class="inline-flex items-center rounded-md border border-jt-line bg-jt-surface p-0.5">
        <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            :class="[
                'inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1 text-sm transition',
                modelValue === opt.value
                    ? 'bg-jt-base text-jt-fg shadow'
                    : 'text-jt-fg-muted hover:text-jt-fg',
            ]"
            @click="emit('update:modelValue', opt.value)"
        >
            <Icon v-if="opt.icon" :name="opt.icon" class="h-3.5 w-3.5" />
            {{ opt.label }}
        </button>
    </div>
</template>
