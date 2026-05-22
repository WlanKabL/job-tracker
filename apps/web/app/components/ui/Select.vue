<script setup lang="ts" generic="T extends string | number">
interface Option {
    value: T;
    label: string;
}

interface Props {
    modelValue: T | undefined;
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
    label?: string;
    error?: string;
    hint?: string;
    id?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    "update:modelValue": [value: T | undefined];
}>();

const onChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    if (!target.value) {
        emit("update:modelValue", undefined);
        return;
    }
    const matched = props.options.find((o) => String(o.value) === target.value);
    emit("update:modelValue", matched ? matched.value : undefined);
};

const fieldId = computed(() => props.id ?? `s-${Math.random().toString(36).slice(2)}`);
</script>

<template>
    <div class="flex flex-col gap-1">
        <label v-if="label" :for="fieldId" class="text-xs font-medium text-jt-fg-soft">
            {{ label }}
        </label>
        <div class="relative">
            <select
                :id="fieldId"
                :value="modelValue === undefined ? '' : String(modelValue)"
                :disabled="disabled"
                :class="[
                    'w-full appearance-none rounded-md border bg-jt-surface pl-3 pr-9 py-2 text-sm text-jt-fg',
                    error ? 'border-jt-danger' : 'border-jt-line',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jt-brand focus-visible:border-jt-brand',
                    disabled ? 'opacity-60 cursor-not-allowed' : '',
                ]"
                @change="onChange"
            >
                <option v-if="placeholder" value="">{{ placeholder }}</option>
                <option v-for="opt in options" :key="String(opt.value)" :value="String(opt.value)">
                    {{ opt.label }}
                </option>
            </select>
            <Icon
                name="i-lucide-chevron-down"
                class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jt-fg-muted"
            />
        </div>
        <p v-if="error" class="text-xs text-jt-danger">{{ error }}</p>
        <p v-else-if="hint" class="text-xs text-jt-fg-muted">{{ hint }}</p>
    </div>
</template>
