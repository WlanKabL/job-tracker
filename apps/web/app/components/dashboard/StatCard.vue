<script setup lang="ts">
interface Props {
    label: string;
    value: string | number;
    hint?: string;
    icon?: string;
    accent?: "default" | "brand" | "success" | "warning" | "danger";
}

const props = withDefaults(defineProps<Props>(), { accent: "default" });

const accentBg: Record<NonNullable<Props["accent"]>, string> = {
    default: "bg-jt-surface-raised text-jt-fg-muted",
    brand: "bg-jt-brand-soft text-jt-brand",
    success: "bg-jt-success-soft text-jt-success",
    warning: "bg-jt-warning-soft text-jt-warning",
    danger: "bg-jt-danger-soft text-jt-danger",
};

const accentBorder: Record<NonNullable<Props["accent"]>, string> = {
    default: "",
    brand: "before:bg-jt-brand",
    success: "before:bg-jt-success",
    warning: "before:bg-jt-warning",
    danger: "before:bg-jt-danger",
};
</script>

<template>
    <div
        :class="[
            'relative overflow-hidden rounded-xl border border-jt-line bg-jt-surface p-4 transition hover:bg-jt-surface-hover',
            'before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-xl',
            accentBorder[accent],
        ]"
    >
        <div class="flex items-start justify-between gap-3">
            <span class="text-[11px] font-medium uppercase tracking-wider text-jt-fg-muted">
                {{ label }}
            </span>
            <div
                v-if="icon"
                :class="['flex h-8 w-8 items-center justify-center rounded-lg', accentBg[accent]]"
            >
                <Icon :name="icon" class="h-4 w-4" />
            </div>
        </div>
        <div class="mt-2 text-2xl font-semibold leading-tight text-jt-fg sm:text-3xl">
            {{ value }}
        </div>
        <p v-if="hint" class="mt-1 text-xs text-jt-fg-muted">{{ hint }}</p>
    </div>
</template>
