<script setup lang="ts">
interface Props {
    modelValue: number | undefined;
    max?: number;
    readonly?: boolean;
    size?: "sm" | "md";
}

const props = withDefaults(defineProps<Props>(), { max: 5, size: "md" });
const emit = defineEmits<{ "update:modelValue": [v: number | undefined] }>();

const sizeClass = computed(() => (props.size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"));

const set = (n: number) => {
    if (props.readonly) return;
    if (props.modelValue === n) {
        emit("update:modelValue", undefined);
        return;
    }
    emit("update:modelValue", n);
};
</script>

<template>
    <div class="inline-flex items-center gap-0.5">
        <button
            v-for="n in max"
            :key="n"
            type="button"
            :disabled="readonly"
            :class="['p-0.5 transition', readonly ? 'cursor-default' : 'hover:scale-110']"
            @click="set(n)"
        >
            <Icon
                :name="(modelValue ?? 0) >= n ? 'i-lucide-star' : 'i-lucide-star'"
                :class="[
                    sizeClass,
                    (modelValue ?? 0) >= n
                        ? 'fill-jt-warning text-jt-warning'
                        : 'text-jt-fg-faint',
                ]"
            />
        </button>
    </div>
</template>
