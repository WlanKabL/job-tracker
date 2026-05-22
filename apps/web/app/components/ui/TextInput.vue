<script setup lang="ts">
interface Props {
    modelValue: string | number | undefined;
    type?: "text" | "email" | "url" | "tel" | "number" | "date" | "datetime-local" | "search" | "password";
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    icon?: string;
    error?: string;
    label?: string;
    hint?: string;
    autofocus?: boolean;
    autocomplete?: string;
    inputmode?: "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
    step?: string | number;
    min?: string | number;
    max?: string | number;
    name?: string;
    id?: string;
}

const props = withDefaults(defineProps<Props>(), { type: "text" });

const emit = defineEmits<{
    "update:modelValue": [value: string];
    blur: [event: FocusEvent];
    focus: [event: FocusEvent];
    keydown: [event: KeyboardEvent];
}>();

const onInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit("update:modelValue", target.value);
};

const fieldId = computed(() => props.id ?? `f-${Math.random().toString(36).slice(2)}`);
</script>

<template>
    <div class="flex flex-col gap-1">
        <label v-if="label" :for="fieldId" class="text-xs font-medium text-jt-fg-soft">
            {{ label }}
        </label>
        <div class="relative">
            <Icon
                v-if="icon"
                :name="icon"
                class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jt-fg-muted"
            />
            <input
                :id="fieldId"
                :type="type"
                :name="name"
                :value="modelValue ?? ''"
                :placeholder="placeholder"
                :disabled="disabled"
                :readonly="readonly"
                :autofocus="autofocus"
                :autocomplete="autocomplete"
                :inputmode="inputmode"
                :step="step"
                :min="min"
                :max="max"
                :class="[
                    'w-full rounded-md border bg-jt-surface px-3 py-2 text-sm text-jt-fg placeholder:text-jt-fg-faint',
                    icon ? 'pl-9' : '',
                    error ? 'border-jt-danger' : 'border-jt-line',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jt-brand focus-visible:border-jt-brand',
                    disabled ? 'opacity-60 cursor-not-allowed' : '',
                ]"
                @input="onInput"
                @blur="(e) => emit('blur', e)"
                @focus="(e) => emit('focus', e)"
                @keydown="(e) => emit('keydown', e)"
            />
        </div>
        <p v-if="error" class="text-xs text-jt-danger">{{ error }}</p>
        <p v-else-if="hint" class="text-xs text-jt-fg-muted">{{ hint }}</p>
    </div>
</template>
