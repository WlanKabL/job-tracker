<script setup lang="ts">
interface Tab {
    id: string;
    label: string;
    icon?: string;
    count?: number;
}

interface Props {
    modelValue: string;
    tabs: Tab[];
}

defineProps<Props>();
const emit = defineEmits<{ "update:modelValue": [id: string] }>();
</script>

<template>
    <div class="flex items-center gap-1 border-b border-jt-line">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            :class="[
                'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition',
                modelValue === tab.id
                    ? 'border-jt-brand text-jt-fg'
                    : 'border-transparent text-jt-fg-muted hover:text-jt-fg',
            ]"
            @click="emit('update:modelValue', tab.id)"
        >
            <Icon v-if="tab.icon" :name="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
            <span
                v-if="typeof tab.count === 'number'"
                class="rounded-full bg-jt-surface px-1.5 text-xs"
            >
                {{ tab.count }}
            </span>
        </button>
    </div>
</template>
