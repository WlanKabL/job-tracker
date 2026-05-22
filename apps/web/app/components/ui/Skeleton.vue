<script setup lang="ts">
interface Props {
    height?: string;
    width?: string;
    rounded?: "sm" | "md" | "lg" | "full";
}

const props = withDefaults(defineProps<Props>(), {
    height: "1rem",
    width: "100%",
    rounded: "md",
});

const roundedClass = computed(
    () =>
        ({
            sm: "rounded",
            md: "rounded-md",
            lg: "rounded-lg",
            full: "rounded-full",
        })[props.rounded],
);
</script>

<template>
    <div
        :class="['animate-pulse bg-jt-surface-raised', roundedClass]"
        :style="{ height, width }"
    />
</template>
