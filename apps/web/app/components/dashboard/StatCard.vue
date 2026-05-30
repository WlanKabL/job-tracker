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
    default: "before:bg-jt-line",
    brand: "before:bg-jt-brand",
    success: "before:bg-jt-success",
    warning: "before:bg-jt-warning",
    danger: "before:bg-jt-danger",
};
</script>

<template>
    <div
        :class="[
            'group relative overflow-hidden rounded-2xl border border-jt-line bg-jt-surface px-5 py-4',
            'transition-all duration-200 hover:-translate-y-0.5 hover:bg-jt-surface-hover hover:border-jt-line',
            'before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[2px] before:rounded-full before:transition-all before:duration-200',
            'group-hover:before:top-2 group-hover:before:bottom-2',
            accentBorder[accent],
        ]"
    >
        <div class="flex items-start justify-between gap-3">
            <span class="text-[10px] font-medium uppercase tracking-[0.14em] text-jt-fg-muted">
                {{ label }}
            </span>
            <div
                v-if="icon"
                :class="[
                    'flex h-7 w-7 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110',
                    accentBg[accent],
                ]"
            >
                <Icon :name="icon" class="h-3.5 w-3.5" />
            </div>
        </div>
        <div class="font-display-tight tabular mt-2 text-4xl leading-none text-jt-fg sm:text-[2.6rem]">
            {{ value }}
        </div>
        <p v-if="hint" class="mt-2 text-xs text-jt-fg-muted leading-snug">{{ hint }}</p>
    </div>
</template>
