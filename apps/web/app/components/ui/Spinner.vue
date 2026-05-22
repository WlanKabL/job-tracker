<script setup lang="ts">
interface Props {
    size?: "sm" | "md" | "lg";
    label?: string;
}

withDefaults(defineProps<Props>(), { size: "md" });

const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
} as const;
</script>

<template>
    <div class="inline-flex items-center gap-2 text-jt-fg-muted">
        <Icon name="i-lucide-loader-2" :class="['animate-spin', sizeClass[size]]" />
        <span v-if="label" class="text-sm">{{ label }}</span>
    </div>
</template>
