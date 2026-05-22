<script setup lang="ts">
import type { ApplicationStatus } from "@job-tracker/shared";

interface Props {
    status: ApplicationStatus;
    size?: "sm" | "md";
    withIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), { size: "md", withIcon: true });
const meta = computed(() => useStatusMeta(props.status));

const sizeClasses = computed(() => (props.size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs"));
const iconClass = computed(() => (props.size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"));
</script>

<template>
    <span
        :class="[
            'inline-flex items-center gap-1 rounded-md font-medium leading-none whitespace-nowrap border',
            sizeClasses,
            meta.badgeClass,
        ]"
    >
        <Icon v-if="withIcon" :name="meta.icon" :class="iconClass" />
        {{ meta.label }}
    </span>
</template>
