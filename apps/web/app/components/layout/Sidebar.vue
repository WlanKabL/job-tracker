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
    <nav class="flex h-full flex-col gap-1 px-3 pb-3 pt-4">
        <NuxtLink
            to="/"
            class="group mb-4 flex items-center gap-3 px-2 py-1"
            @click="$emit('navigate')"
        >
            <div
                class="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-jt-brand bg-[image:var(--jt-brand-gradient)] text-jt-brand-text shadow-[0_4px_18px_-4px_rgba(155,137,255,0.5)]"
            >
                <Icon name="i-lucide-briefcase" class="relative z-10 h-4 w-4" />
                <span class="absolute inset-0 bg-white/10 mix-blend-overlay"></span>
            </div>
            <div class="flex flex-col leading-none">
                <span class="font-display tracking-tight text-[15px] font-medium text-jt-fg">
                    Job Tracker
                </span>
                <span class="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-jt-fg-faint">
                    Operator
                </span>
            </div>
        </NuxtLink>

        <div class="flex flex-col gap-0.5">
            <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                :class="[
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                    item.match(route.path)
                        ? 'bg-jt-brand-soft text-jt-brand font-medium'
                        : 'text-jt-fg-soft hover:bg-jt-surface-hover hover:text-jt-fg',
                ]"
                @click="$emit('navigate')"
            >
                <span
                    v-if="item.match(route.path)"
                    class="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-jt-brand"
                ></span>
                <Icon :name="item.icon" class="h-4 w-4 shrink-0" />
                <span class="flex-1">{{ item.label }}</span>
                <span
                    v-if="typeof item.count === 'number' && item.count > 0"
                    :class="[
                        'tabular rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                        item.match(route.path)
                            ? 'bg-jt-brand/15 text-jt-brand'
                            : 'bg-jt-surface-raised text-jt-fg-muted group-hover:bg-jt-surface',
                    ]"
                >
                    {{ item.count }}
                </span>
            </NuxtLink>
        </div>

        <div class="mt-auto px-1 pt-4 pb-1">
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
