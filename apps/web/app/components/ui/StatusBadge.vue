<script setup lang="ts">
import type { ApplicationStatus } from "@job-tracker/shared";

interface Props {
    status: ApplicationStatus;
    size?: "sm" | "md";
    withIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), { size: "md", withIcon: true });
const meta = computed(() => useStatusMeta(props.status));

const sizeClasses = computed(() =>
    props.size === "sm"
        ? "px-1.5 py-0.5 text-[10px] tracking-wider"
        : "px-2 py-1 text-[11px] tracking-wider",
);
const iconClass = computed(() => (props.size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"));
</script>

<template>
    <span
        :class="[
            'inline-flex items-center gap-1.5 rounded-md border font-medium uppercase leading-none whitespace-nowrap',
            sizeClasses,
            meta.badgeClass,
        ]"
    >
        <span :class="['h-1.5 w-1.5 shrink-0 rounded-full', meta.dotClass]"></span>
        {{ meta.label }}
    </span>
</template>
