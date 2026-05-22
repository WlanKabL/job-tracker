<script setup lang="ts">
import type { Application, TimelineEntry, TimelineEntryType } from "@job-tracker/shared";

interface Props {
    application: Application;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    add: [input: { type: TimelineEntryType; title: string; description?: string; occurredAt?: string }];
    remove: [entryId: string];
}>();

const t = useT();
const confirm = useConfirm();

const entries = computed<TimelineEntry[]>(() =>
    [...props.application.timeline].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
);

const iconByType: Record<TimelineEntryType, string> = {
    status_change: "i-lucide-arrow-right-circle",
    note: "i-lucide-sticky-note",
    email: "i-lucide-mail",
    call: "i-lucide-phone",
    meeting: "i-lucide-users",
    document: "i-lucide-paperclip",
};

interface NewEntryState {
    open: boolean;
    type: TimelineEntryType;
    title: string;
    description: string;
    occurredAt: string;
}

const newEntry = reactive<NewEntryState>({
    open: false,
    type: "note",
    title: "",
    description: "",
    occurredAt: "",
});

const openAdd = (type: TimelineEntryType) => {
    newEntry.open = true;
    newEntry.type = type;
    newEntry.title = "";
    newEntry.description = "";
    newEntry.occurredAt = new Date().toISOString().slice(0, 16);
};

const submit = () => {
    if (!newEntry.title.trim()) return;
    emit("add", {
        type: newEntry.type,
        title: newEntry.title.trim(),
        description: newEntry.description.trim() || undefined,
        occurredAt: newEntry.occurredAt ? new Date(newEntry.occurredAt).toISOString() : undefined,
    });
    newEntry.open = false;
};

const askRemove = async (entry: TimelineEntry) => {
    const confirmed = await confirm.open({
        title: t.common.delete,
        body: `„${entry.title}" wirklich entfernen?`,
        variant: "danger",
        confirmLabel: t.common.delete,
    });
    if (!confirmed) return;
    emit("remove", entry.id);
};
</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-2">
            <UiButton size="sm" variant="outline" icon="i-lucide-sticky-note" @click="openAdd('note')">
                {{ t.timelineList.addNote }}
            </UiButton>
            <UiButton size="sm" variant="outline" icon="i-lucide-mail" @click="openAdd('email')">
                {{ t.timelineList.addEmail }}
            </UiButton>
            <UiButton size="sm" variant="outline" icon="i-lucide-phone" @click="openAdd('call')">
                {{ t.timelineList.addCall }}
            </UiButton>
            <UiButton size="sm" variant="outline" icon="i-lucide-users" @click="openAdd('meeting')">
                {{ t.timelineList.addMeeting }}
            </UiButton>
        </div>

        <p v-if="entries.length === 0" class="text-sm italic text-jt-fg-faint">
            {{ t.timeline.empty }}
        </p>

        <ol v-else class="relative flex flex-col gap-3 border-l border-jt-line pl-5">
            <li v-for="entry in entries" :key="entry.id" class="relative">
                <span
                    class="absolute -left-7 top-2 flex h-5 w-5 items-center justify-center rounded-full border border-jt-line bg-jt-base text-jt-fg-muted"
                >
                    <Icon :name="iconByType[entry.type]" class="h-3 w-3" />
                </span>
                <div class="rounded-md border border-jt-line bg-jt-surface px-3 py-2">
                    <div class="flex items-center justify-between gap-3">
                        <div class="text-sm font-medium text-jt-fg">
                            {{ entry.title }}
                        </div>
                        <button
                            v-if="entry.type !== 'status_change'"
                            type="button"
                            class="rounded p-1 text-jt-fg-faint hover:bg-jt-surface-hover hover:text-jt-fg"
                            :aria-label="t.common.delete"
                            @click="askRemove(entry)"
                        >
                            <Icon name="i-lucide-x" class="h-3 w-3" />
                        </button>
                    </div>
                    <p v-if="entry.description" class="mt-1 text-xs text-jt-fg-soft whitespace-pre-line">
                        {{ entry.description }}
                    </p>
                    <div class="mt-1 flex items-center gap-2 text-[11px] text-jt-fg-muted">
                        <span>{{ formatDateTime(entry.occurredAt) }}</span>
                        <span>· {{ t.timeline.type[entry.type] }}</span>
                    </div>
                </div>
            </li>
        </ol>

        <UiModal :open="newEntry.open" :title="t.timeline.addEntry" size="md" @close="newEntry.open = false">
            <div class="flex flex-col gap-3">
                <UiTextInput
                    v-model="newEntry.title"
                    :label="t.timelineList.title"
                    autofocus
                />
                <UiTextarea
                    v-model="newEntry.description"
                    :label="t.timelineList.description"
                    :rows="3"
                />
                <UiTextInput
                    v-model="newEntry.occurredAt"
                    type="datetime-local"
                    :label="t.timelineList.date"
                />
            </div>
            <template #footer>
                <UiButton variant="ghost" @click="newEntry.open = false">
                    {{ t.common.cancel }}
                </UiButton>
                <UiButton variant="brand" :disabled="!newEntry.title.trim()" @click="submit">
                    {{ t.common.save }}
                </UiButton>
            </template>
        </UiModal>
    </div>
</template>
