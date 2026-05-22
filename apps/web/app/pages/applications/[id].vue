<script setup lang="ts">
import type {
    Application,
    ApplicationUpdateInput,
    ContactCreateInput,
    ContactUpdateInput,
    DocumentCreateInput,
    DocumentUpdateInput,
    OpenQuestionCreateInput,
    OpenQuestionUpdateInput,
    StatusChangeInput,
    TimelineEntryCreateInput,
} from "@job-tracker/shared";

const t = useT();
const route = useRoute("applications-id");
const api = useApi();
const toast = useToast();
const confirm = useConfirm();
const applicationsStore = useApplicationsStore();
const companiesStore = useCompaniesStore();

const id = computed(() => route.params.id as string);

const { data, pending, error } = await useAsyncData(
    `application-${id.value}`,
    () => api.applications.get(id.value),
    { watch: [id] },
);

useHead({ title: () => data.value?.position ?? t.common.loading });

type Tab =
    | "overview"
    | "cheatsheet"
    | "openQuestions"
    | "timeline"
    | "contacts"
    | "documents"
    | "description";
const tab = ref<Tab>("overview");

const tabs = computed(() => [
    { id: "overview" as Tab, label: t.applicationDetail.tabs.overview, icon: "i-lucide-info" },
    {
        id: "cheatsheet" as Tab,
        label: t.applicationDetail.tabs.cheatsheet,
        icon: "i-lucide-notebook-text",
    },
    {
        id: "openQuestions" as Tab,
        label: t.applicationDetail.tabs.openQuestions,
        icon: "i-lucide-help-circle",
        count: data.value?.openQuestions?.length,
    },
    {
        id: "timeline" as Tab,
        label: t.applicationDetail.tabs.timeline,
        icon: "i-lucide-history",
        count: data.value?.timeline.length,
    },
    {
        id: "contacts" as Tab,
        label: t.applicationDetail.tabs.contacts,
        icon: "i-lucide-users",
        count: data.value?.contacts.length,
    },
    {
        id: "documents" as Tab,
        label: t.applicationDetail.tabs.documents,
        icon: "i-lucide-folder-open",
        count: data.value?.documents.length,
    },
    {
        id: "description" as Tab,
        label: t.applicationDetail.tabs.description,
        icon: "i-lucide-file-text",
    },
]);

const updateLocal = (next: Application) => {
    if (data.value) {
        const company = data.value.company;
        data.value = { ...next, company };
    }
    applicationsStore.upsert(next);
};

const cheatsheet = ref("");
watch(
    data,
    (v) => {
        if (v) cheatsheet.value = v.cheatsheet ?? "";
    },
    { immediate: true },
);

const saveCheatsheet = async () => {
    if (!data.value) return;
    try {
        const updated = await api.applications.update(data.value.id, {
            cheatsheet: cheatsheet.value,
        });
        updateLocal(updated);
        toast.success(t.toast.saved);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

const editOpen = ref(false);

const onSaveMeta = async (patch: ApplicationUpdateInput) => {
    if (!data.value) return;
    try {
        const updated = await api.applications.update(data.value.id, patch);
        updateLocal(updated);
        editOpen.value = false;
        toast.success(t.toast.saved);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

const onStatusChange = async (input: StatusChangeInput) => {
    if (!data.value) return;
    try {
        const updated = await api.applications.changeStatus(data.value.id, input);
        updateLocal(updated);
        toast.success(t.toast.statusChanged);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

const onToggleArchive = async () => {
    if (!data.value) return;
    try {
        const updated = await api.applications.setArchived(data.value.id, !data.value.archived);
        updateLocal(updated);
        toast.success(t.toast.saved);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

const onDelete = async () => {
    if (!data.value) return;
    const confirmed = await confirm.open({
        title: t.applicationDetail.deleteConfirm.title,
        body: t.applicationDetail.deleteConfirm.body,
        variant: "danger",
        confirmLabel: t.common.delete,
    });
    if (!confirmed) return;
    try {
        await api.applications.delete(data.value.id);
        applicationsStore.removeLocal(data.value.id);
        toast.success(t.toast.deleted);
        navigateTo("/applications");
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

const wrapMutate = async (action: () => Promise<Application>) => {
    if (!data.value) return;
    try {
        const updated = await action();
        updateLocal(updated);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

const onAddTimeline = (input: TimelineEntryCreateInput) =>
    wrapMutate(() => api.applications.addTimelineEntry(data.value!.id, input)).then(() =>
        toast.success(t.toast.saved),
    );
const onRemoveTimeline = (entryId: string) =>
    wrapMutate(() => api.applications.deleteTimelineEntry(data.value!.id, entryId)).then(() =>
        toast.success(t.toast.deleted),
    );
const onAddContact = (input: ContactCreateInput) =>
    wrapMutate(() => api.applications.addContact(data.value!.id, input));
const onUpdateContact = (args: { contactId: string; patch: ContactUpdateInput }) =>
    wrapMutate(() => api.applications.updateContact(data.value!.id, args.contactId, args.patch));
const onRemoveContact = (contactId: string) =>
    wrapMutate(() => api.applications.deleteContact(data.value!.id, contactId));
const onAddDocument = (input: DocumentCreateInput) =>
    wrapMutate(() => api.applications.addDocument(data.value!.id, input));
const onUpdateDocument = (args: { documentId: string; patch: DocumentUpdateInput }) =>
    wrapMutate(() =>
        api.applications.updateDocument(data.value!.id, args.documentId, args.patch),
    );
const onRemoveDocument = (documentId: string) =>
    wrapMutate(() => api.applications.deleteDocument(data.value!.id, documentId));
const onAddOpenQuestion = (input: OpenQuestionCreateInput) =>
    wrapMutate(() => api.applications.addOpenQuestion(data.value!.id, input)).then(() =>
        toast.success(t.toast.saved),
    );
const onUpdateOpenQuestion = (args: { questionId: string; patch: OpenQuestionUpdateInput }) =>
    wrapMutate(() =>
        api.applications.updateOpenQuestion(data.value!.id, args.questionId, args.patch),
    );
const onRemoveOpenQuestion = (questionId: string) =>
    wrapMutate(() => api.applications.deleteOpenQuestion(data.value!.id, questionId));

await companiesStore.fetchAll();

const switchToDescription = () => {
    tab.value = "description";
};
</script>

<template>
    <div class="mx-auto max-w-4xl">
        <div v-if="pending && !data" class="flex justify-center py-10">
            <UiSpinner :label="t.common.loading" />
        </div>

        <div v-else-if="error || !data" class="rounded-md bg-jt-danger-soft p-4 text-jt-danger">
            {{ extractErrorMessage(error) || t.errors.notFound }}
        </div>

        <template v-else>
            <LayoutPageHeader :title="data.position" back-to="/applications">
                <template #actions>
                    <ApplicationStatusChangeMenu :current="data.status" @change="onStatusChange" />
                    <UiButton variant="outline" icon="i-lucide-pencil" @click="editOpen = true">
                        {{ t.common.edit }}
                    </UiButton>
                    <UiButton
                        variant="ghost"
                        :icon="data.archived ? 'i-lucide-rotate-ccw' : 'i-lucide-archive'"
                        @click="onToggleArchive"
                    >
                        {{ data.archived ? t.common.unarchive : t.common.archive }}
                    </UiButton>
                    <UiButton variant="ghost" icon="i-lucide-trash-2" @click="onDelete">
                        {{ t.common.delete }}
                    </UiButton>
                </template>
            </LayoutPageHeader>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <UiStatusBadge :status="data.status" />
                <UiSourceBadge :source="data.source" />
                <span class="text-sm text-jt-fg-muted">
                    <NuxtLink
                        v-if="data.company"
                        :to="`/companies/${data.company.id}`"
                        class="font-medium text-jt-fg hover:underline"
                    >
                        {{ data.company.name }}
                    </NuxtLink>
                    <span v-else class="italic">{{ t.common.unknown }}</span>
                    <span v-if="data.company?.industry" class="text-jt-fg-faint">
                        · {{ data.company.industry }}
                    </span>
                    <span v-if="data.company?.size" class="text-jt-fg-faint">
                        · {{ t.companySize[data.company.size] }}
                    </span>
                    <span v-if="data.location" class="text-jt-fg-faint">
                        · {{ data.location }}
                    </span>
                </span>
                <a
                    v-if="data.company?.website"
                    :href="data.company.website"
                    target="_blank"
                    rel="noreferrer noopener"
                    class="inline-flex items-center gap-1 rounded-md border border-jt-line bg-jt-surface px-2 py-0.5 text-xs text-jt-fg-soft hover:text-jt-fg"
                >
                    <Icon name="i-lucide-external-link" class="h-3 w-3" />
                    Web
                </a>
                <span class="ml-auto text-xs text-jt-fg-faint">
                    {{ formatRelative(data.updatedAt) }}
                </span>
            </div>

            <UiTabs
                :model-value="tab"
                :tabs="tabs"
                class="mb-4"
                @update:model-value="(tabId) => (tab = tabId as Tab)"
            />

            <UiCard :padded="tab !== 'description'">
                <ApplicationOverviewCard
                    v-if="tab === 'overview'"
                    :application="data"
                    @open-description="switchToDescription"
                />

                <ApplicationCheatsheetEditor
                    v-else-if="tab === 'cheatsheet'"
                    v-model="cheatsheet"
                    @save="saveCheatsheet"
                />

                <ApplicationOpenQuestionsList
                    v-else-if="tab === 'openQuestions'"
                    :application="data"
                    @add="onAddOpenQuestion"
                    @update="onUpdateOpenQuestion"
                    @remove="onRemoveOpenQuestion"
                />

                <ApplicationTimelineList
                    v-else-if="tab === 'timeline'"
                    :application="data"
                    @add="onAddTimeline"
                    @remove="onRemoveTimeline"
                />

                <ApplicationContactsList
                    v-else-if="tab === 'contacts'"
                    :application="data"
                    @add="onAddContact"
                    @update="onUpdateContact"
                    @remove="onRemoveContact"
                />

                <ApplicationDocumentsList
                    v-else-if="tab === 'documents'"
                    :application="data"
                    @add="onAddDocument"
                    @update="onUpdateDocument"
                    @remove="onRemoveDocument"
                />

                <div v-else-if="tab === 'description'" class="p-4">
                    <p v-if="!data.description" class="text-sm italic text-jt-fg-faint">
                        {{ t.common.empty }}
                    </p>
                    <pre
                        v-else
                        class="whitespace-pre-wrap break-words text-sm text-jt-fg-soft"
                    >{{ data.description }}</pre>
                </div>
            </UiCard>

            <ApplicationEditMetaModal
                :application="data"
                :open="editOpen"
                @close="editOpen = false"
                @save="onSaveMeta"
            />
        </template>
    </div>
</template>
