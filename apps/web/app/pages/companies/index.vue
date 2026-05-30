<script setup lang="ts">
const t = useT();
const store = useCompaniesStore();
useHead({ title: t.companies.title });

await store.fetchAll();

const search = ref("");
const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return store.items;
    return store.items.filter(
        (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.industry ?? "").toLowerCase().includes(q) ||
            (c.location ?? "").toLowerCase().includes(q),
    );
});

const totalApplications = computed(() =>
    store.items.reduce((sum, c) => sum + c.applicationCount, 0),
);
</script>

<template>
    <div>
        <LayoutPageHeader
            eyebrow="Workspace"
            :title="t.companies.title"
            :subtitle="t.companies.subtitle"
        />

        <div class="jt-enter jt-enter-d100 mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-jt-line bg-jt-surface p-3">
            <UiTextInput
                v-model="search"
                :placeholder="t.common.search"
                icon="i-lucide-search"
                class="max-w-md flex-1"
            />
            <div class="tabular ml-auto flex items-center gap-4 text-[11px] uppercase tracking-[0.14em] text-jt-fg-muted">
                <span>
                    <span class="text-jt-fg font-medium">{{ filtered.length }}</span>
                    Firmen
                </span>
                <span class="hidden sm:inline-block h-3 w-px bg-jt-line"></span>
                <span class="hidden sm:inline">
                    <span class="text-jt-fg font-medium">{{ totalApplications }}</span>
                    Bewerbungen
                </span>
            </div>
        </div>

        <div v-if="store.loading && store.items.length === 0" class="flex justify-center py-10">
            <UiSpinner :label="t.common.loading" />
        </div>

        <UiEmptyState
            v-else-if="store.items.length === 0"
            icon="i-lucide-building-2"
            :title="t.companies.empty"
            :description="t.applications.emptyHint"
            :action-label="t.applications.startImport"
            @action="navigateTo('/applications/new')"
        />

        <div v-else class="jt-enter jt-enter-d200 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
                v-for="company in filtered"
                :key="company.id"
                :to="`/companies/${company.id}`"
                class="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-jt-line bg-jt-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-jt-fg-faint hover:bg-jt-surface-hover"
            >
                <div
                    aria-hidden="true"
                    class="absolute inset-y-0 left-0 w-[2px] origin-left scale-y-0 bg-jt-brand transition-transform duration-200 group-hover:scale-y-100"
                ></div>
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                        <h3 class="font-display truncate text-lg leading-snug text-jt-fg">
                            {{ company.name }}
                        </h3>
                        <p v-if="company.industry" class="mt-0.5 truncate text-xs text-jt-fg-muted">
                            {{ company.industry }}
                        </p>
                    </div>
                    <span
                        :class="[
                            'tabular shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                            company.applicationCount > 1
                                ? 'bg-jt-warning-soft text-jt-warning'
                                : 'bg-jt-brand-soft text-jt-brand',
                        ]"
                        :title="`${company.applicationCount} Bewerbung${company.applicationCount === 1 ? '' : 'en'}`"
                    >
                        {{ company.applicationCount }}
                    </span>
                </div>
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-jt-fg-muted">
                    <span v-if="company.location" class="inline-flex items-center gap-1">
                        <Icon name="i-lucide-map-pin" class="h-3 w-3" />
                        {{ company.location }}
                    </span>
                    <span v-if="company.size" class="inline-flex items-center gap-1">
                        <Icon name="i-lucide-users" class="h-3 w-3" />
                        {{ t.companySize[company.size] }}
                    </span>
                </div>
            </NuxtLink>
        </div>
    </div>
</template>
