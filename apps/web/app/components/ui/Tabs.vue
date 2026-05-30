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
    <div class="relative flex items-center gap-0.5 border-b border-jt-line overflow-x-auto">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            :class="[
                'group relative inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition',
                modelValue === tab.id
                    ? 'text-jt-fg'
                    : 'text-jt-fg-muted hover:text-jt-fg',
            ]"
            @click="emit('update:modelValue', tab.id)"
        >
            <Icon
                v-if="tab.icon"
                :name="tab.icon"
                :class="[
                    'h-4 w-4 transition',
                    modelValue === tab.id ? 'text-jt-brand' : '',
                ]"
            />
            {{ tab.label }}
            <span
                v-if="typeof tab.count === 'number' && tab.count > 0"
                :class="[
                    'tabular rounded-md px-1.5 py-0.5 text-[10px] font-medium transition',
                    modelValue === tab.id
                        ? 'bg-jt-brand-soft text-jt-brand'
                        : 'bg-jt-surface-raised text-jt-fg-muted',
                ]"
            >
                {{ tab.count }}
            </span>
            <span
                v-if="modelValue === tab.id"
                aria-hidden="true"
                class="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-jt-brand"
            ></span>
        </button>
    </div>
</template>
