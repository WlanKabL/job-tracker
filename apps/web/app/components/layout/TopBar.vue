<script setup lang="ts">
const { theme, toggle } = useTheme();

defineEmits<{ "open-sidebar": [] }>();

const today = computed(() =>
    new Date().toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }),
);
</script>

<template>
    <header
        class="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-jt-line bg-jt-base/85 px-4 backdrop-blur-md backdrop-saturate-150 sm:px-6"
    >
        <button
            type="button"
            class="rounded p-2 text-jt-fg-soft hover:bg-jt-surface-hover hover:text-jt-fg md:hidden"
            aria-label="Menü öffnen"
            @click="$emit('open-sidebar')"
        >
            <Icon name="i-lucide-menu" class="h-5 w-5" />
        </button>

        <div class="hidden items-center gap-2 text-xs text-jt-fg-muted md:flex">
            <Icon name="i-lucide-calendar-days" class="h-3.5 w-3.5" />
            <span class="tabular">{{ today }}</span>
        </div>

        <div class="flex flex-1 items-center justify-end gap-1">
            <button
                type="button"
                class="rounded-md p-2 text-jt-fg-soft transition hover:bg-jt-surface-hover hover:text-jt-fg"
                :title="theme === 'dark' ? 'Light Mode' : 'Dark Mode'"
                @click="toggle"
            >
                <Icon
                    :name="theme === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
                    class="h-4 w-4"
                />
            </button>
        </div>
    </header>
</template>
