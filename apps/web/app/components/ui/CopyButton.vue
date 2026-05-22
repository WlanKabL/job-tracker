<script setup lang="ts">
interface Props {
    text: string;
    label?: string;
    icon?: string;
    size?: "sm" | "md";
    variant?: "brand" | "ghost" | "subtle" | "outline";
}

const props = withDefaults(defineProps<Props>(), {
    size: "md",
    variant: "ghost",
    icon: "i-lucide-clipboard",
});

const copy = useClipboardCopy();
const onClick = () => copy(props.text);
</script>

<template>
    <UiButton :size="size" :variant="variant" :icon="icon" @click="onClick">
        <slot>{{ label }}</slot>
    </UiButton>
</template>
