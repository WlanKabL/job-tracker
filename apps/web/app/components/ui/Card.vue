<script setup lang="ts">
interface Props {
    padded?: boolean;
    hover?: boolean;
    as?: string;
}

const props = withDefaults(defineProps<Props>(), {
    padded: true,
    hover: false,
    as: "div",
});
</script>

<template>
    <component
        :is="props.as"
        :class="[
            'rounded-xl border border-jt-line bg-jt-surface',
            padded ? 'p-4' : '',
            hover ? 'transition hover:bg-jt-surface-hover hover:border-jt-line' : '',
        ]"
    >
        <slot />
    </component>
</template>
