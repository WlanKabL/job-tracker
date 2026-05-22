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
</script>

<template>
    <div>
        <LayoutPageHeader :title="t.companies.title" :subtitle="t.companies.subtitle" />

        <div class="mb-4 flex flex-wrap items-center gap-3">
            <UiTextInput
                v-model="search"
                :placeholder="t.common.search"
                icon="i-lucide-search"
                class="max-w-md flex-1"
            />
            <span class="text-xs text-jt-fg-muted">
                {{ t.companies.countLabel(filtered.length) }}
            </span>
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

        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
                v-for="company in filtered"
                :key="company.id"
                :to="`/companies/${company.id}`"
                class="flex flex-col gap-2 rounded-xl border border-jt-line bg-jt-surface p-4 transition hover:bg-jt-surface-hover"
            >
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                        <h3 class="truncate text-base font-semibold text-jt-fg">{{ company.name }}</h3>
                        <p v-if="company.industry" class="truncate text-xs text-jt-fg-muted">
                            {{ company.industry }}
                        </p>
                    </div>
                    <UiBadge variant="brand" size="sm">
                        {{ company.applicationCount }}
                    </UiBadge>
                </div>
                <div class="flex flex-wrap items-center gap-2 text-xs text-jt-fg-muted">
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
