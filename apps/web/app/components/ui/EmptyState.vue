<script setup lang="ts">
interface Props {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
}

withDefaults(defineProps<Props>(), { icon: "i-lucide-inbox" });

const emit = defineEmits<{ action: [] }>();
</script>

<template>
    <div
        class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-jt-line bg-jt-surface/50 px-6 py-10 text-center"
    >
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-jt-surface text-jt-fg-muted">
            <Icon :name="icon" class="h-6 w-6" />
        </div>
        <h3 class="text-base font-medium text-jt-fg">{{ title }}</h3>
        <p v-if="description" class="max-w-sm text-sm text-jt-fg-muted">
            {{ description }}
        </p>
        <UiButton v-if="actionLabel" variant="brand" class="mt-2" @click="emit('action')">
            {{ actionLabel }}
        </UiButton>
    </div>
</template>
