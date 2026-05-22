<script setup lang="ts">
const t = useT();
const route = useRoute();
const applicationsStore = useApplicationsStore();
const companiesStore = useCompaniesStore();

interface NavItem {
    to: string;
    icon: string;
    label: string;
    match: (path: string) => boolean;
    count?: number;
}

const activeCount = computed(() => applicationsStore.items.filter((a) => !a.archived).length);

const navItems = computed<NavItem[]>(() => [
    {
        to: "/",
        icon: "i-lucide-layout-dashboard",
        label: t.nav.dashboard,
        match: (p) => p === "/",
    },
    {
        to: "/applications",
        icon: "i-lucide-briefcase",
        label: t.nav.applications,
        match: (p) => p.startsWith("/applications"),
        count: activeCount.value,
    },
    {
        to: "/companies",
        icon: "i-lucide-building-2",
        label: t.nav.companies,
        match: (p) => p.startsWith("/companies"),
        count: companiesStore.items.length,
    },
    {
        to: "/prompts",
        icon: "i-lucide-sparkles",
        label: t.nav.prompts,
        match: (p) => p.startsWith("/prompts"),
    },
    {
        to: "/settings",
        icon: "i-lucide-settings",
        label: t.nav.settings,
        match: (p) => p.startsWith("/settings"),
    },
]);

defineEmits<{ navigate: [] }>();
</script>

<template>
    <nav class="flex h-full flex-col gap-1 p-3">
        <div class="mb-2 px-2 py-2">
            <NuxtLink
                to="/"
                class="flex items-center gap-2.5 text-base font-semibold text-jt-fg"
                @click="$emit('navigate')"
            >
                <div
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-jt-brand to-jt-info text-white shadow-md"
                >
                    <Icon name="i-lucide-briefcase" class="h-4 w-4" />
                </div>
                <span class="tracking-tight">{{ t.app.name }}</span>
            </NuxtLink>
        </div>

        <div class="flex flex-col gap-0.5">
            <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                :class="[
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition',
                    item.match(route.path)
                        ? 'bg-jt-brand-soft text-jt-brand font-medium'
                        : 'text-jt-fg-soft hover:bg-jt-surface-hover hover:text-jt-fg',
                ]"
                @click="$emit('navigate')"
            >
                <Icon :name="item.icon" class="h-4 w-4 shrink-0" />
                <span class="flex-1">{{ item.label }}</span>
                <span
                    v-if="typeof item.count === 'number' && item.count > 0"
                    :class="[
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
                        item.match(route.path)
                            ? 'bg-jt-brand text-white'
                            : 'bg-jt-surface-raised text-jt-fg-muted group-hover:bg-jt-surface',
                    ]"
                >
                    {{ item.count }}
                </span>
            </NuxtLink>
        </div>

        <div class="mt-auto px-1 pt-3 pb-1">
            <UiButton
                variant="brand"
                icon="i-lucide-plus"
                block
                @click="navigateTo('/applications/new'); $emit('navigate')"
            >
                {{ t.nav.newApplication }}
            </UiButton>
        </div>
    </nav>
</template>
