<script setup lang="ts">
import type {
    Application,
    ApplicationSource,
    ApplicationUpdateInput,
    WorkMode,
} from "@job-tracker/shared";
import { APPLICATION_SOURCE, WORK_MODE } from "@job-tracker/shared";

interface Props {
    application: Application;
    open: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    close: [];
    save: [patch: ApplicationUpdateInput];
}>();

const t = useT();

const form = reactive({
    position: props.application.position,
    source: props.application.source as ApplicationSource,
    sourceUrl: props.application.sourceUrl ?? "",
    appliedAt: props.application.appliedAt?.slice(0, 10) ?? "",
    nextFollowUpAt: props.application.nextFollowUpAt?.slice(0, 10) ?? "",
    location: props.application.location ?? "",
    workMode: props.application.workMode as WorkMode | undefined,
    salaryMin: props.application.salary?.min !== undefined ? String(props.application.salary.min) : "",
    salaryMax: props.application.salary?.max !== undefined ? String(props.application.salary.max) : "",
    salaryCurrency: props.application.salary?.currency ?? "EUR",
    techStack: [...props.application.techStack],
    requirements: [...props.application.requirements],
    niceToHaves: [...props.application.niceToHaves],
    benefits: [...props.application.benefits],
    notes: props.application.notes ?? "",
    rating: props.application.rating,
});

watch(
    () => props.application,
    (app) => {
        form.position = app.position;
        form.source = app.source;
        form.sourceUrl = app.sourceUrl ?? "";
        form.appliedAt = app.appliedAt?.slice(0, 10) ?? "";
        form.nextFollowUpAt = app.nextFollowUpAt?.slice(0, 10) ?? "";
        form.location = app.location ?? "";
        form.workMode = app.workMode;
        form.salaryMin = app.salary?.min !== undefined ? String(app.salary.min) : "";
        form.salaryMax = app.salary?.max !== undefined ? String(app.salary.max) : "";
        form.salaryCurrency = app.salary?.currency ?? "EUR";
        form.techStack = [...app.techStack];
        form.requirements = [...app.requirements];
        form.niceToHaves = [...app.niceToHaves];
        form.benefits = [...app.benefits];
        form.notes = app.notes ?? "";
        form.rating = app.rating;
    },
);

const sourceOptions = APPLICATION_SOURCE.map((s) => ({ value: s, label: t.source[s] }));
const workModeOptions = WORK_MODE.map((m) => ({ value: m, label: t.workMode[m] }));

const submit = () => {
    const min = form.salaryMin ? Number(form.salaryMin) : undefined;
    const max = form.salaryMax ? Number(form.salaryMax) : undefined;
    const patch: ApplicationUpdateInput = {
        position: form.position.trim(),
        source: form.source,
        sourceUrl: form.sourceUrl.trim() || undefined,
        appliedAt: form.appliedAt ? new Date(form.appliedAt).toISOString() : undefined,
        nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : undefined,
        location: form.location.trim() || undefined,
        workMode: form.workMode,
        salary:
            min !== undefined || max !== undefined
                ? { min, max, currency: form.salaryCurrency || "EUR", period: "yearly" }
                : undefined,
        techStack: form.techStack,
        requirements: form.requirements,
        niceToHaves: form.niceToHaves,
        benefits: form.benefits,
        notes: form.notes.trim() || undefined,
        rating: form.rating,
    };
    emit("save", patch);
};
</script>

<template>
    <UiModal :open="open" :title="t.common.edit" size="lg" @close="emit('close')">
        <div class="flex flex-col gap-3">
            <UiTextInput v-model="form.position" :label="t.applicationForm.fields.position" />
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <UiSelect v-model="form.source" :label="t.applicationForm.fields.source" :options="sourceOptions" />
                <UiTextInput v-model="form.sourceUrl" :label="t.applicationForm.fields.sourceUrl" type="url" />
                <UiTextInput v-model="form.appliedAt" type="date" :label="t.applicationForm.fields.appliedAt" />
                <UiTextInput v-model="form.nextFollowUpAt" type="date" :label="t.applicationForm.fields.nextFollowUpAt" />
                <UiTextInput v-model="form.location" :label="t.applicationForm.fields.location" />
                <UiSelect
                    v-model="form.workMode"
                    :label="t.applicationForm.fields.workMode"
                    :options="workModeOptions"
                    placeholder="—"
                />
            </div>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                <UiTextInput v-model="form.salaryMin" type="number" :label="t.applicationForm.fields.salaryMin" />
                <UiTextInput v-model="form.salaryMax" type="number" :label="t.applicationForm.fields.salaryMax" />
                <UiTextInput v-model="form.salaryCurrency" :label="t.applicationForm.fields.salaryCurrency" />
            </div>
            <div>
                <span class="mb-1 block text-xs font-medium text-jt-fg-soft">
                    {{ t.applicationForm.fields.rating }}
                </span>
                <UiRating v-model="form.rating" />
            </div>
            <UiTagInput v-model="form.techStack" :label="t.applicationForm.fields.techStack" />
            <UiTagInput v-model="form.requirements" :label="t.applicationForm.fields.requirements" />
            <UiTagInput v-model="form.niceToHaves" :label="t.applicationForm.fields.niceToHaves" />
            <UiTagInput v-model="form.benefits" :label="t.applicationForm.fields.benefits" />
            <UiTextarea v-model="form.notes" :label="t.applicationForm.fields.notes" :rows="3" />
        </div>
        <template #footer>
            <UiButton variant="ghost" @click="emit('close')">{{ t.common.cancel }}</UiButton>
            <UiButton variant="brand" @click="submit">{{ t.common.save }}</UiButton>
        </template>
    </UiModal>
</template>
