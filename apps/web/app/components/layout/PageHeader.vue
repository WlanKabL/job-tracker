<script setup lang="ts">
interface Props {
    title: string;
    subtitle?: string;
    backTo?: string;
    eyebrow?: string;
}

defineProps<Props>();
</script>

<template>
    <div class="jt-enter mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0 flex-1">
            <NuxtLink
                v-if="backTo"
                :to="backTo"
                class="group mb-2 inline-flex items-center gap-1.5 text-xs text-jt-fg-muted transition hover:text-jt-fg"
            >
                <Icon
                    name="i-lucide-arrow-left"
                    class="h-3 w-3 transition-transform group-hover:-translate-x-0.5"
                />
                zurück
            </NuxtLink>
            <p
                v-if="eyebrow"
                class="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-jt-fg-muted"
            >
                <span class="h-px w-6 bg-jt-brand/60"></span>
                {{ eyebrow }}
            </p>
            <h1 class="font-display-tight truncate text-4xl leading-[1.05] text-jt-fg sm:text-[2.5rem]">
                {{ title }}
            </h1>
            <p v-if="subtitle" class="mt-2 max-w-2xl text-sm leading-relaxed text-jt-fg-muted">
                {{ subtitle }}
            </p>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-2">
            <slot name="actions" />
        </div>
    </div>
</template>
