<script setup lang="ts">
interface Props {
    title: string;
    subtitle?: string;
    backTo?: string;
}

defineProps<Props>();
</script>

<template>
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0 flex-1">
            <NuxtLink
                v-if="backTo"
                :to="backTo"
                class="mb-1 inline-flex items-center gap-1 text-xs text-jt-fg-muted hover:text-jt-fg"
            >
                <Icon name="i-lucide-arrow-left" class="h-3 w-3" />
                zurück
            </NuxtLink>
            <h1 class="truncate text-2xl font-semibold tracking-tight text-jt-fg">
                {{ title }}
            </h1>
            <p v-if="subtitle" class="mt-1 text-sm text-jt-fg-muted">{{ subtitle }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
            <slot name="actions" />
        </div>
    </div>
</template>
