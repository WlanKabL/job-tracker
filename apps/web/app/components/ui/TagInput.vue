<script setup lang="ts">
interface Props {
    modelValue: string[];
    placeholder?: string;
    label?: string;
    hint?: string;
    suggestions?: string[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
    "update:modelValue": [value: string[]];
}>();

const t = useT();
const input = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

const add = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    if (props.modelValue.includes(value)) return;
    emit("update:modelValue", [...props.modelValue, value]);
};

const remove = (tag: string) => {
    emit(
        "update:modelValue",
        props.modelValue.filter((v) => v !== tag),
    );
};

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === ",") {
        event.preventDefault();
        add(input.value);
        input.value = "";
        return;
    }
    if (event.key === "Backspace" && input.value === "" && props.modelValue.length > 0) {
        remove(props.modelValue[props.modelValue.length - 1]!);
    }
};

const onBlur = () => {
    if (input.value.trim()) {
        add(input.value);
        input.value = "";
    }
};

const placeholder = computed(() => props.placeholder ?? t.applicationForm.placeholders.tagInput);
</script>

<template>
    <div class="flex flex-col gap-1">
        <label v-if="label" class="text-xs font-medium text-jt-fg-soft">{{ label }}</label>
        <div
            class="flex flex-wrap items-center gap-1.5 rounded-md border border-jt-line bg-jt-surface px-2 py-1.5 focus-within:border-jt-brand focus-within:ring-2 focus-within:ring-jt-brand"
            @click="inputRef?.focus()"
        >
            <span
                v-for="tag in modelValue"
                :key="tag"
                class="inline-flex items-center gap-1 rounded-md bg-jt-brand-soft px-2 py-0.5 text-xs text-jt-brand"
            >
                {{ tag }}
                <button
                    type="button"
                    class="rounded p-0.5 hover:bg-jt-brand/20"
                    :aria-label="`${tag} entfernen`"
                    @click.stop="remove(tag)"
                >
                    <Icon name="i-lucide-x" class="h-3 w-3" />
                </button>
            </span>
            <input
                ref="inputRef"
                v-model="input"
                type="text"
                :placeholder="placeholder"
                class="min-w-[80px] flex-1 bg-transparent px-1 py-0.5 text-sm text-jt-fg outline-none placeholder:text-jt-fg-faint"
                @keydown="handleKeydown"
                @blur="onBlur"
            />
        </div>
        <p v-if="hint" class="text-xs text-jt-fg-muted">{{ hint }}</p>
    </div>
</template>
