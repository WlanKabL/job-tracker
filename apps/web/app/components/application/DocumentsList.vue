<script setup lang="ts">
import type { Application, Document, DocumentCreateInput, DocumentType, DocumentUpdateInput } from "@job-tracker/shared";
import { DOCUMENT_TYPE } from "@job-tracker/shared";

interface Props {
    application: Application;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    add: [input: DocumentCreateInput];
    update: [args: { documentId: string; patch: DocumentUpdateInput }];
    remove: [documentId: string];
}>();

const t = useT();
const confirm = useConfirm();

const typeOptions = DOCUMENT_TYPE.map((value) => ({ value, label: t.document.type[value] }));

const editing = ref<Document | null>(null);
const open = ref(false);

const form = reactive<DocumentCreateInput>({
    type: "cv",
    name: "",
    filename: undefined,
    url: undefined,
    version: undefined,
    notes: undefined,
});

const openAdd = () => {
    editing.value = null;
    Object.assign(form, {
        type: "cv" as DocumentType,
        name: "",
        filename: "",
        url: "",
        version: "",
        notes: "",
    });
    open.value = true;
};

const openEdit = (doc: Document) => {
    editing.value = doc;
    Object.assign(form, {
        type: doc.type,
        name: doc.name,
        filename: doc.filename ?? "",
        url: doc.url ?? "",
        version: doc.version ?? "",
        notes: doc.notes ?? "",
    });
    open.value = true;
};

const submit = () => {
    if (!form.name.trim()) return;
    const payload: DocumentCreateInput = {
        type: form.type,
        name: form.name.trim(),
        filename: form.filename?.toString().trim() || undefined,
        url: form.url?.toString().trim() || undefined,
        version: form.version?.toString().trim() || undefined,
        notes: form.notes?.toString().trim() || undefined,
    };
    if (editing.value) {
        emit("update", { documentId: editing.value.id, patch: payload });
    } else {
        emit("add", payload);
    }
    open.value = false;
};

const askRemove = async (doc: Document) => {
    const confirmed = await confirm.open({
        title: t.common.delete,
        body: `„${doc.name}" entfernen?`,
        variant: "danger",
        confirmLabel: t.common.delete,
    });
    if (!confirmed) return;
    emit("remove", doc.id);
};

const iconByType: Record<DocumentType, string> = {
    cv: "i-lucide-file-text",
    cover_letter: "i-lucide-mail",
    portfolio: "i-lucide-folder-open",
    other: "i-lucide-paperclip",
};
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center justify-end">
            <UiButton size="sm" variant="outline" icon="i-lucide-plus" @click="openAdd">
                {{ t.documents.add }}
            </UiButton>
        </div>

        <p v-if="application.documents.length === 0" class="text-sm italic text-jt-fg-faint">
            {{ t.documents.empty }}
        </p>

        <ul v-else class="flex flex-col gap-2">
            <li
                v-for="doc in application.documents"
                :key="doc.id"
                class="flex items-start justify-between gap-3 rounded-md border border-jt-line bg-jt-surface px-3 py-2"
            >
                <div class="flex min-w-0 flex-1 items-start gap-3">
                    <Icon :name="iconByType[doc.type]" class="mt-0.5 h-4 w-4 text-jt-fg-muted" />
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="font-medium text-jt-fg">{{ doc.name }}</span>
                            <span v-if="doc.version" class="rounded bg-jt-surface px-1.5 py-0.5 text-[10px] text-jt-fg-muted">
                                v{{ doc.version }}
                            </span>
                        </div>
                        <div class="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-jt-fg-muted">
                            <span>{{ t.document.type[doc.type] }}</span>
                            <a
                                v-if="doc.url"
                                :href="doc.url"
                                target="_blank"
                                rel="noreferrer noopener"
                                class="inline-flex items-center gap-1 hover:text-jt-fg"
                            >
                                <Icon name="i-lucide-external-link" class="h-3 w-3" />
                                {{ t.documents.url }}
                            </a>
                            <span v-if="doc.filename" class="font-mono">{{ doc.filename }}</span>
                        </div>
                        <p v-if="doc.notes" class="mt-1 text-xs text-jt-fg-soft">
                            {{ doc.notes }}
                        </p>
                    </div>
                </div>
                <div class="flex shrink-0 gap-1">
                    <button
                        type="button"
                        class="rounded p-1 text-jt-fg-muted hover:bg-jt-surface-hover hover:text-jt-fg"
                        :aria-label="t.common.edit"
                        @click="openEdit(doc)"
                    >
                        <Icon name="i-lucide-pencil" class="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        class="rounded p-1 text-jt-fg-muted hover:bg-jt-surface-hover hover:text-jt-danger"
                        :aria-label="t.common.delete"
                        @click="askRemove(doc)"
                    >
                        <Icon name="i-lucide-trash-2" class="h-3 w-3" />
                    </button>
                </div>
            </li>
        </ul>

        <UiModal
            :open="open"
            :title="editing ? t.common.edit : t.documents.add"
            size="md"
            @close="open = false"
        >
            <div class="flex flex-col gap-3">
                <UiSelect v-model="form.type" :label="t.documents.type" :options="typeOptions" />
                <UiTextInput v-model="form.name" :label="t.documents.name" autofocus />
                <UiTextInput v-model="form.url" :label="t.documents.url" type="url" />
                <UiTextInput v-model="form.filename" :label="t.documents.filename" />
                <UiTextInput v-model="form.version" :label="t.documents.version" />
                <UiTextarea v-model="form.notes" :label="t.documents.notes" :rows="3" />
            </div>
            <template #footer>
                <UiButton variant="ghost" @click="open = false">{{ t.common.cancel }}</UiButton>
                <UiButton variant="brand" :disabled="!form.name.trim()" @click="submit">
                    {{ t.common.save }}
                </UiButton>
            </template>
        </UiModal>
    </div>
</template>
