<script setup lang="ts">
interface Props {
    modelValue: string | undefined;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    label?: string;
    error?: string;
    hint?: string;
    monospace?: boolean;
    autofocus?: boolean;
    id?: string;
}

const props = withDefaults(defineProps<Props>(), { rows: 4 });

const emit = defineEmits<{
    "update:modelValue": [value: string];
    blur: [event: FocusEvent];
}>();

const onInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    emit("update:modelValue", target.value);
};

const fieldId = computed(() => props.id ?? `t-${Math.random().toString(36).slice(2)}`);
</script>

<template>
    <div class="flex flex-col gap-1">
        <label v-if="label" :for="fieldId" class="text-xs font-medium text-jt-fg-soft">
            {{ label }}
        </label>
        <textarea
            :id="fieldId"
            :rows="rows"
            :value="modelValue ?? ''"
            :placeholder="placeholder"
            :disabled="disabled"
            :autofocus="autofocus"
            :class="[
                'w-full rounded-md border bg-jt-surface px-3 py-2 text-sm text-jt-fg placeholder:text-jt-fg-faint resize-y',
                monospace ? 'font-mono text-xs leading-relaxed' : '',
                error ? 'border-jt-danger' : 'border-jt-line',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jt-brand focus-visible:border-jt-brand',
                disabled ? 'opacity-60 cursor-not-allowed' : '',
            ]"
            @input="onInput"
            @blur="(e) => emit('blur', e)"
        />
        <p v-if="error" class="text-xs text-jt-danger">{{ error }}</p>
        <p v-else-if="hint" class="text-xs text-jt-fg-muted">{{ hint }}</p>
    </div>
</template>
