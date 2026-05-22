<script setup lang="ts">
import type { CompanyUpdateInput } from "@job-tracker/shared";
import { COMPANY_SIZE } from "@job-tracker/shared";
import type { ApplicationWithCompany } from "~/composables/useApi";

const t = useT();
const route = useRoute("companies-id");
const toast = useToast();
const confirm = useConfirm();
const companiesStore = useCompaniesStore();
const applicationsStore = useApplicationsStore();
const api = useApi();

const id = computed(() => route.params.id as string);

const { data, pending, error } = await useAsyncData(
    `company-${id.value}`,
    () => api.companies.get(id.value),
    { watch: [id] },
);

useHead({ title: () => data.value?.name ?? t.common.loading });

const sizeOptions = [
    { value: "", label: "—" } as { value: string; label: string },
    ...COMPANY_SIZE.map((s) => ({ value: s, label: t.companySize[s] })),
];

const editOpen = ref(false);
const form = reactive({
    name: "",
    website: "",
    industry: "",
    size: "",
    location: "",
    notes: "",
    cheatsheet: "",
});

watch(
    data,
    (v) => {
        if (!v) return;
        form.name = v.name;
        form.website = v.website ?? "";
        form.industry = v.industry ?? "";
        form.size = v.size ?? "";
        form.location = v.location ?? "";
        form.notes = v.notes ?? "";
        form.cheatsheet = v.cheatsheet ?? "";
    },
    { immediate: true },
);

const openEdit = () => {
    editOpen.value = true;
};

const saveEdit = async () => {
    if (!data.value) return;
    const patch: CompanyUpdateInput = {
        name: form.name.trim(),
        website: form.website.trim() || undefined,
        industry: form.industry.trim() || undefined,
        size: (form.size || undefined) as CompanyUpdateInput["size"],
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined,
    };
    try {
        const updated = await companiesStore.update(data.value.id, patch);
        if (data.value) data.value = { ...data.value, ...updated };
        editOpen.value = false;
        toast.success(t.toast.saved);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

const saveCheatsheet = async () => {
    if (!data.value) return;
    try {
        const updated = await companiesStore.update(data.value.id, {
            cheatsheet: form.cheatsheet,
        });
        if (data.value) data.value = { ...data.value, ...updated };
        toast.success(t.toast.saved);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

const saveNotes = async () => {
    if (!data.value) return;
    try {
        const updated = await companiesStore.update(data.value.id, {
            notes: form.notes,
        });
        if (data.value) data.value = { ...data.value, ...updated };
        toast.success(t.toast.saved);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

const onDelete = async () => {
    if (!data.value) return;
    if (data.value.applications.length > 0) {
        toast.error(t.companyDetail.deleteConfirm.blocked(data.value.applications.length));
        return;
    }
    const confirmed = await confirm.open({
        title: t.companyDetail.deleteConfirm.title,
        body: t.companyDetail.deleteConfirm.body,
        variant: "danger",
        confirmLabel: t.common.delete,
    });
    if (!confirmed) return;
    try {
        await companiesStore.remove(data.value.id);
        toast.success(t.toast.deleted);
        navigateTo("/companies");
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

await applicationsStore.fetchAll();

const applications = computed<ApplicationWithCompany[]>(() =>
    (data.value?.applications ?? []).map((a) => ({ ...a, company: data.value ?? null })),
);

const openWebsite = () => {
    if (data.value?.website) window.open(data.value.website, "_blank", "noopener");
};

const websiteLabel = computed(() =>
    data.value?.website
        ? data.value.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
        : null,
);
</script>

<template>
    <div class="mx-auto max-w-5xl">
        <div v-if="pending && !data" class="flex justify-center py-10">
            <UiSpinner :label="t.common.loading" />
        </div>
        <div v-else-if="error || !data" class="rounded-md bg-jt-danger-soft p-4 text-jt-danger">
            {{ extractErrorMessage(error) || t.errors.notFound }}
        </div>
        <template v-else>
            <LayoutPageHeader :title="data.name" back-to="/companies">
                <template #actions>
                    <UiButton
                        v-if="data.website"
                        variant="ghost"
                        icon="i-lucide-external-link"
                        :title="data.website"
                        @click="openWebsite"
                    >
                        Web
                    </UiButton>
                    <UiButton variant="outline" icon="i-lucide-pencil" @click="openEdit">
                        {{ t.common.edit }}
                    </UiButton>
                    <UiButton variant="ghost" icon="i-lucide-trash-2" @click="onDelete">
                        {{ t.common.delete }}
                    </UiButton>
                </template>
            </LayoutPageHeader>

            <div class="mb-5 flex flex-wrap items-center gap-2 text-sm text-jt-fg-muted">
                <span v-if="data.industry" class="inline-flex items-center gap-1 rounded-md border border-jt-line bg-jt-surface px-2 py-0.5">
                    <Icon name="i-lucide-tag" class="h-3 w-3" />{{ data.industry }}
                </span>
                <span v-if="data.size" class="inline-flex items-center gap-1 rounded-md border border-jt-line bg-jt-surface px-2 py-0.5">
                    <Icon name="i-lucide-users" class="h-3 w-3" />{{ t.companySize[data.size] }}
                </span>
                <span v-if="data.location" class="inline-flex items-center gap-1 rounded-md border border-jt-line bg-jt-surface px-2 py-0.5">
                    <Icon name="i-lucide-map-pin" class="h-3 w-3" />{{ data.location }}
                </span>
                <a
                    v-if="data.website"
                    :href="data.website"
                    target="_blank"
                    rel="noreferrer noopener"
                    class="inline-flex items-center gap-1 rounded-md border border-jt-line bg-jt-surface px-2 py-0.5 hover:text-jt-fg"
                >
                    <Icon name="i-lucide-globe" class="h-3 w-3" />{{ websiteLabel }}
                </a>
                <span class="ml-auto text-xs text-jt-fg-faint">
                    {{ formatRelative(data.updatedAt) }}
                </span>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <section class="lg:col-span-2 flex flex-col gap-4">
                    <UiCard>
                        <header class="mb-3 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <Icon name="i-lucide-briefcase" class="h-4 w-4 text-jt-brand" />
                                <h2 class="text-sm font-semibold uppercase tracking-wide text-jt-fg-muted">
                                    {{ t.companyDetail.applications }}
                                </h2>
                                <span class="rounded-full bg-jt-surface-raised px-2 py-0.5 text-xs text-jt-fg-muted">
                                    {{ data.applications.length }}
                                </span>
                            </div>
                            <UiButton
                                size="sm"
                                variant="outline"
                                icon="i-lucide-plus"
                                @click="navigateTo('/applications/new')"
                            >
                                {{ t.companyDetail.addApplication }}
                            </UiButton>
                        </header>
                        <div v-if="applications.length === 0" class="text-sm italic text-jt-fg-faint">
                            {{ t.common.empty }}
                        </div>
                        <div v-else class="flex flex-col gap-2">
                            <ApplicationListRow
                                v-for="app in applications"
                                :key="app.id"
                                :application="app"
                            />
                        </div>
                    </UiCard>

                    <UiCard>
                        <header class="mb-3 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <Icon name="i-lucide-sticky-note" class="h-4 w-4 text-jt-fg-muted" />
                                <h2 class="text-sm font-semibold uppercase tracking-wide text-jt-fg-muted">
                                    {{ t.applicationForm.fields.companyNotes }}
                                </h2>
                            </div>
                            <UiButton
                                size="sm"
                                variant="brand"
                                icon="i-lucide-save"
                                :disabled="form.notes === (data.notes ?? '')"
                                @click="saveNotes"
                            >
                                {{ t.common.save }}
                            </UiButton>
                        </header>
                        <UiTextarea
                            v-model="form.notes"
                            :rows="6"
                            placeholder="Schnelle Notizen zur Firma — Recruiter-Reaktion, Kultur, Stack, was du noch klären willst…"
                        />
                    </UiCard>
                </section>

                <section>
                    <UiCard>
                        <header class="mb-3 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <Icon name="i-lucide-notebook-text" class="h-4 w-4 text-jt-brand" />
                                <h2 class="text-sm font-semibold uppercase tracking-wide text-jt-fg-muted">
                                    {{ t.companyDetail.cheatsheet }}
                                </h2>
                            </div>
                            <UiButton
                                size="sm"
                                variant="brand"
                                icon="i-lucide-save"
                                :disabled="form.cheatsheet === (data.cheatsheet ?? '')"
                                @click="saveCheatsheet"
                            >
                                {{ t.common.save }}
                            </UiButton>
                        </header>
                        <UiTextarea
                            v-model="form.cheatsheet"
                            :rows="20"
                            monospace
                            :placeholder="t.applicationForm.fields.companyCheatsheet"
                        />
                    </UiCard>
                </section>
            </div>

            <UiModal :open="editOpen" :title="t.common.edit" size="md" @close="editOpen = false">
                <div class="flex flex-col gap-3">
                    <UiTextInput v-model="form.name" :label="t.applicationForm.fields.companyName" />
                    <UiTextInput
                        v-model="form.website"
                        :label="t.applicationForm.fields.companyWebsite"
                        type="url"
                    />
                    <UiTextInput
                        v-model="form.industry"
                        :label="t.applicationForm.fields.companyIndustry"
                    />
                    <UiSelect
                        v-model="form.size"
                        :label="t.applicationForm.fields.companySize"
                        :options="sizeOptions"
                    />
                    <UiTextInput
                        v-model="form.location"
                        :label="t.applicationForm.fields.companyLocation"
                    />
                </div>
                <template #footer>
                    <UiButton variant="ghost" @click="editOpen = false">{{ t.common.cancel }}</UiButton>
                    <UiButton variant="brand" :disabled="!form.name.trim()" @click="saveEdit">
                        {{ t.common.save }}
                    </UiButton>
                </template>
            </UiModal>
        </template>
    </div>
</template>
