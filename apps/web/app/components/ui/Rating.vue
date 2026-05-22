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

/** Inline SVG so the fill="currentColor" trick works — Iconify mask-rendered icons ignore fill. */
const STAR_PATH =
    "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
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
            <svg
                :class="[
                    sizeClass,
                    (modelValue ?? 0) >= n ? 'text-jt-warning' : 'text-jt-fg-faint/40',
                ]"
                viewBox="0 0 24 24"
                fill="currentColor"
                :stroke="(modelValue ?? 0) >= n ? 'none' : 'currentColor'"
                stroke-width="1.5"
                aria-hidden="true"
            >
                <path :d="STAR_PATH" :fill-opacity="(modelValue ?? 0) >= n ? 1 : 0.15" />
            </svg>
        </button>
    </div>
</template>
