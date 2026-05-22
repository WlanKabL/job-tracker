<script setup lang="ts">
import type { ApplicationSource } from "@job-tracker/shared";

interface Props {
    source: ApplicationSource;
    size?: "sm" | "md";
}

const props = withDefaults(defineProps<Props>(), { size: "md" });
const meta = computed(() => useSourceMeta(props.source));

const sizeClasses = computed(() => (props.size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs"));
const iconClass = computed(() => (props.size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"));
</script>

<template>
    <span
        :class="[
            'inline-flex items-center gap-1 rounded-md border border-jt-line bg-jt-surface text-jt-fg-soft font-medium leading-none whitespace-nowrap',
            sizeClasses,
        ]"
    >
        <Icon :name="meta.icon" :class="iconClass" />
        {{ meta.label }}
    </span>
</template>
