<script setup lang="ts">
type Variant = "brand" | "ghost" | "outline" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

interface Props {
    variant?: Variant;
    size?: Size;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
    icon?: string;
    iconRight?: string;
    block?: boolean;
    title?: string;
}

const props = withDefaults(defineProps<Props>(), {
    variant: "subtle",
    size: "md",
    type: "button",
});

const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition select-none disabled:cursor-not-allowed disabled:opacity-50";

const sizeClasses: Record<Size, string> = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
};

const variantClasses: Record<Variant, string> = {
    brand: "bg-jt-brand text-jt-brand-text hover:bg-jt-brand-hover shadow-sm",
    ghost: "text-jt-fg-soft hover:text-jt-fg hover:bg-jt-surface-hover",
    outline:
        "border border-jt-line bg-transparent text-jt-fg hover:bg-jt-surface-hover",
    danger: "bg-jt-danger text-white hover:opacity-90",
    subtle: "bg-jt-surface text-jt-fg hover:bg-jt-surface-hover",
};

const iconSize = computed(() => (props.size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"));
</script>

<template>
    <button
        :type="type"
        :title="title"
        :disabled="disabled || loading"
        :class="[
            baseClasses,
            sizeClasses[size],
            variantClasses[variant],
            block ? 'w-full' : '',
        ]"
    >
        <Icon v-if="loading" name="i-lucide-loader-2" :class="['animate-spin', iconSize]" />
        <Icon v-else-if="icon" :name="icon" :class="iconSize" />
        <slot />
        <Icon v-if="iconRight" :name="iconRight" :class="iconSize" />
    </button>
</template>
