<script setup lang="ts">
type Variant = "default" | "brand" | "success" | "warning" | "danger" | "info";
type Size = "sm" | "md";

interface Props {
    variant?: Variant;
    size?: Size;
    icon?: string;
    extraClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
    variant: "default",
    size: "md",
});

const sizeClasses: Record<Size, string> = {
    sm: "px-1.5 py-0.5 text-[11px]",
    md: "px-2 py-0.5 text-xs",
};

const variantClasses: Record<Variant, string> = {
    default: "bg-jt-surface text-jt-fg-soft border border-jt-line",
    brand: "bg-jt-brand-soft text-jt-brand border border-jt-brand/30",
    success: "bg-jt-success-soft text-jt-success border border-jt-success/30",
    warning: "bg-jt-warning-soft text-jt-warning border border-jt-warning/30",
    danger: "bg-jt-danger-soft text-jt-danger border border-jt-danger/30",
    info: "bg-jt-info-soft text-jt-info border border-jt-info/30",
};

const iconClass = computed(() => (props.size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"));
</script>

<template>
    <span
        :class="[
            'inline-flex items-center gap-1 rounded-md font-medium leading-none whitespace-nowrap',
            sizeClasses[size],
            variantClasses[variant],
            extraClass,
        ]"
    >
        <Icon v-if="icon" :name="icon" :class="iconClass" />
        <slot />
    </span>
</template>
