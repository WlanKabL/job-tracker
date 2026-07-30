<script setup lang="ts">
import type { Application, Contact, ContactCreateInput, ContactUpdateInput } from "@job-tracker/shared";

interface Props {
    application: Application;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    add: [input: ContactCreateInput];
    update: [args: { contactId: string; patch: ContactUpdateInput }];
    remove: [contactId: string];
}>();

const t = useT();
const confirm = useConfirm();

const editing = ref<Contact | null>(null);
const form = reactive<ContactCreateInput>({
    name: "",
    role: undefined,
    email: undefined,
    phone: undefined,
    linkedinUrl: undefined,
    notes: undefined,
});
const open = ref(false);

const openAdd = () => {
    editing.value = null;
    Object.assign(form, { name: "", role: "", email: "", phone: "", linkedinUrl: "", notes: "" });
    open.value = true;
};

const openEdit = (contact: Contact) => {
    editing.value = contact;
    Object.assign(form, {
        name: contact.name,
        role: contact.role ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        linkedinUrl: contact.linkedinUrl ?? "",
        notes: contact.notes ?? "",
    });
    open.value = true;
};

const submit = () => {
    if (!form.name.trim()) return;
    const payload: ContactCreateInput = {
        name: form.name.trim(),
        role: form.role?.toString().trim() ?? "",
        email: form.email?.toString().trim() ?? "",
        phone: form.phone?.toString().trim() ?? "",
        linkedinUrl: form.linkedinUrl?.toString().trim() ?? "",
        notes: form.notes?.toString().trim() ?? "",
    };
    if (editing.value) {
        emit("update", { contactId: editing.value.id, patch: payload });
    } else {
        emit("add", payload);
    }
    open.value = false;
};

const askRemove = async (contact: Contact) => {
    const confirmed = await confirm.open({
        title: t.common.delete,
        body: `„${contact.name}" entfernen?`,
        variant: "danger",
        confirmLabel: t.common.delete,
    });
    if (!confirmed) return;
    emit("remove", contact.id);
};
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center justify-end">
            <UiButton size="sm" variant="outline" icon="i-lucide-user-plus" @click="openAdd">
                {{ t.contacts.add }}
            </UiButton>
        </div>

        <p v-if="application.contacts.length === 0" class="text-sm italic text-jt-fg-faint">
            {{ t.contacts.empty }}
        </p>

        <ul v-else class="flex flex-col gap-2">
            <li
                v-for="contact in application.contacts"
                :key="contact.id"
                class="flex items-start justify-between gap-3 rounded-md border border-jt-line bg-jt-surface px-3 py-2"
            >
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-jt-fg">{{ contact.name }}</span>
                        <span v-if="contact.role" class="text-xs text-jt-fg-muted">
                            · {{ contact.role }}
                        </span>
                    </div>
                    <div class="mt-0.5 flex flex-wrap gap-3 text-xs text-jt-fg-muted">
                        <a
                            v-if="contact.email"
                            :href="`mailto:${contact.email}`"
                            class="flex items-center gap-1 hover:text-jt-fg"
                        >
                            <Icon name="i-lucide-mail" class="h-3 w-3" />
                            {{ contact.email }}
                        </a>
                        <a
                            v-if="contact.phone"
                            :href="`tel:${contact.phone}`"
                            class="flex items-center gap-1 hover:text-jt-fg"
                        >
                            <Icon name="i-lucide-phone" class="h-3 w-3" />
                            {{ contact.phone }}
                        </a>
                        <a
                            v-if="contact.linkedinUrl"
                            :href="contact.linkedinUrl"
                            target="_blank"
                            rel="noreferrer noopener"
                            class="flex items-center gap-1 hover:text-jt-fg"
                        >
                            <Icon name="i-simple-icons-linkedin" class="h-3 w-3" />
                            LinkedIn
                        </a>
                    </div>
                    <p v-if="contact.notes" class="mt-1 text-xs text-jt-fg-soft">
                        {{ contact.notes }}
                    </p>
                </div>
                <div class="flex shrink-0 gap-1">
                    <button
                        type="button"
                        class="rounded p-1 text-jt-fg-muted hover:bg-jt-surface-hover hover:text-jt-fg"
                        :aria-label="t.common.edit"
                        @click="openEdit(contact)"
                    >
                        <Icon name="i-lucide-pencil" class="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        class="rounded p-1 text-jt-fg-muted hover:bg-jt-surface-hover hover:text-jt-danger"
                        :aria-label="t.common.delete"
                        @click="askRemove(contact)"
                    >
                        <Icon name="i-lucide-trash-2" class="h-3 w-3" />
                    </button>
                </div>
            </li>
        </ul>

        <UiModal
            :open="open"
            :title="editing ? t.common.edit : t.contacts.add"
            size="md"
            @close="open = false"
        >
            <div class="flex flex-col gap-3">
                <UiTextInput v-model="form.name" :label="t.contacts.name" autofocus />
                <UiTextInput v-model="form.role" :label="t.contacts.role" />
                <UiTextInput v-model="form.email" :label="t.contacts.email" type="email" />
                <UiTextInput v-model="form.phone" :label="t.contacts.phone" type="tel" />
                <UiTextInput v-model="form.linkedinUrl" :label="t.contacts.linkedinUrl" type="url" />
                <UiTextarea v-model="form.notes" :label="t.contacts.notes" :rows="3" />
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
