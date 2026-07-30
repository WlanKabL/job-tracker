<script setup lang="ts">
import type {
    Application,
    OpenQuestion,
    OpenQuestionCreateInput,
    OpenQuestionUpdateInput,
} from "@job-tracker/shared";

interface Props {
    application: Application;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    add: [input: OpenQuestionCreateInput];
    update: [args: { questionId: string; patch: OpenQuestionUpdateInput }];
    remove: [questionId: string];
}>();

const t = useT();
const confirm = useConfirm();

const questions = computed<OpenQuestion[]>(() =>
    [...(props.application.openQuestions ?? [])].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
    ),
);

const total = computed(() => questions.value.length);
const openCount = computed(() => questions.value.filter((q) => !q.answer).length);

interface FormState {
    open: boolean;
    questionId: string | null;
    question: string;
    answer: string;
    askedAt: string;
}

const form = reactive<FormState>({
    open: false,
    questionId: null,
    question: "",
    answer: "",
    askedAt: "",
});

const openAdd = () => {
    form.questionId = null;
    form.question = "";
    form.answer = "";
    form.askedAt = "";
    form.open = true;
};

const openEdit = (q: OpenQuestion) => {
    form.questionId = q.id;
    form.question = q.question;
    form.answer = q.answer ?? "";
    form.askedAt = q.askedAt ? q.askedAt.slice(0, 10) : "";
    form.open = true;
};

const submit = () => {
    if (!form.question.trim()) return;
    const payload: OpenQuestionCreateInput = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        askedAt: form.askedAt ? new Date(form.askedAt).toISOString() : undefined,
    };
    if (form.questionId) {
        emit("update", { questionId: form.questionId, patch: payload });
    } else {
        emit("add", payload);
    }
    form.open = false;
};

const markAsAsked = (q: OpenQuestion) => {
    emit("update", {
        questionId: q.id,
        patch: { askedAt: new Date().toISOString() },
    });
};

const askRemove = async (q: OpenQuestion) => {
    const confirmed = await confirm.open({
        title: t.common.delete,
        body: `„${q.question}" wirklich löschen?`,
        variant: "danger",
        confirmLabel: t.common.delete,
    });
    if (!confirmed) return;
    emit("remove", q.id);
};
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-jt-fg-muted">
                {{ t.openQuestions.countOpen(openCount, total) }}
            </p>
            <UiButton size="sm" variant="outline" icon="i-lucide-help-circle" @click="openAdd">
                {{ t.openQuestions.add }}
            </UiButton>
        </div>

        <p v-if="total === 0" class="text-sm italic text-jt-fg-faint">
            {{ t.openQuestions.empty }}
        </p>

        <ul v-else class="flex flex-col gap-2">
            <li
                v-for="q in questions"
                :key="q.id"
                :class="[
                    'rounded-lg border bg-jt-surface px-4 py-3',
                    q.answer
                        ? 'border-jt-success/30 bg-jt-success-soft/40'
                        : 'border-jt-line',
                ]"
            >
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-start gap-2">
                            <Icon
                                :name="q.answer ? 'i-lucide-check-circle-2' : 'i-lucide-help-circle'"
                                :class="[
                                    'mt-0.5 h-4 w-4 shrink-0',
                                    q.answer ? 'text-jt-success' : 'text-jt-warning',
                                ]"
                            />
                            <p class="text-sm font-medium text-jt-fg">{{ q.question }}</p>
                        </div>
                        <div
                            v-if="q.answer"
                            class="mt-2 ml-6 whitespace-pre-line border-l-2 border-jt-success/40 pl-3 text-sm text-jt-fg-soft"
                        >
                            {{ q.answer }}
                        </div>
                        <div class="mt-2 ml-6 flex flex-wrap items-center gap-2 text-[11px] text-jt-fg-muted">
                            <span
                                v-if="q.answer"
                                class="rounded bg-jt-success-soft px-1.5 py-0.5 text-jt-success"
                            >
                                {{ t.openQuestions.answered }}
                            </span>
                            <span
                                v-else
                                class="rounded bg-jt-warning-soft px-1.5 py-0.5 text-jt-warning"
                            >
                                {{ t.openQuestions.unanswered }}
                            </span>
                            <span v-if="q.askedAt">
                                · {{ t.openQuestions.askedAt }}: {{ formatDate(q.askedAt) }}
                            </span>
                            <span v-if="q.answeredAt">
                                · {{ t.openQuestions.answeredAt }}: {{ formatDate(q.answeredAt) }}
                            </span>
                        </div>
                    </div>
                    <div class="flex shrink-0 gap-1">
                        <button
                            v-if="!q.askedAt && !q.answer"
                            type="button"
                            class="rounded p-1 text-jt-fg-muted hover:bg-jt-surface-hover hover:text-jt-fg"
                            :title="t.openQuestions.markAsAsked"
                            @click="markAsAsked(q)"
                        >
                            <Icon name="i-lucide-message-circle" class="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            class="rounded p-1 text-jt-fg-muted hover:bg-jt-surface-hover hover:text-jt-fg"
                            :aria-label="t.common.edit"
                            @click="openEdit(q)"
                        >
                            <Icon name="i-lucide-pencil" class="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            class="rounded p-1 text-jt-fg-muted hover:bg-jt-surface-hover hover:text-jt-danger"
                            :aria-label="t.common.delete"
                            @click="askRemove(q)"
                        >
                            <Icon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </li>
        </ul>

        <p class="text-xs text-jt-fg-faint">{{ t.openQuestions.addHint }}</p>

        <UiModal
            :open="form.open"
            :title="form.questionId ? t.common.edit : t.openQuestions.add"
            size="md"
            @close="form.open = false"
        >
            <div class="flex flex-col gap-3">
                <UiTextarea
                    v-model="form.question"
                    :label="t.openQuestions.question"
                    :rows="2"
                    autofocus
                />
                <UiTextarea
                    v-model="form.answer"
                    :label="t.openQuestions.answer"
                    :rows="4"
                    hint="Leer lassen wenn noch keine Antwort vorliegt."
                />
                <UiTextInput
                    v-model="form.askedAt"
                    type="date"
                    :label="t.openQuestions.askedAt"
                />
            </div>
            <template #footer>
                <UiButton variant="ghost" @click="form.open = false">
                    {{ t.common.cancel }}
                </UiButton>
                <UiButton variant="brand" :disabled="!form.question.trim()" @click="submit">
                    {{ t.common.save }}
                </UiButton>
            </template>
        </UiModal>
    </div>
</template>
