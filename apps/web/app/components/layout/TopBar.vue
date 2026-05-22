<script setup lang="ts">
const { theme, toggle } = useTheme();

defineEmits<{ "open-sidebar": [] }>();
</script>

<template>
    <header
        class="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-jt-line bg-jt-base/80 px-4 backdrop-blur-md sm:px-6"
    >
        <button
            type="button"
            class="rounded p-2 text-jt-fg-soft hover:bg-jt-surface-hover hover:text-jt-fg md:hidden"
            aria-label="Menü öffnen"
            @click="$emit('open-sidebar')"
        >
            <Icon name="i-lucide-menu" class="h-5 w-5" />
        </button>

        <div class="flex flex-1 items-center justify-end gap-2">
            <button
                type="button"
                class="rounded-md p-2 text-jt-fg-soft hover:bg-jt-surface-hover hover:text-jt-fg"
                :title="theme === 'dark' ? 'Hell' : 'Dunkel'"
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
