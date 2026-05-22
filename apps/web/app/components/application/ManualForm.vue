<script setup lang="ts">
import type {
    Application,
    ApplicationCreateInput,
    ApplicationSource,
    ApplicationStatus,
    WorkMode,
} from "@job-tracker/shared";
import { APPLICATION_SOURCE, APPLICATION_STATUS, WORK_MODE } from "@job-tracker/shared";

const t = useT();
const toast = useToast();
const applicationsStore = useApplicationsStore();

const emit = defineEmits<{ done: [application: Application] }>();

interface FormState {
    companyId: string | null;
    position: string;
    source: ApplicationSource;
    sourceUrl: string;
    status: ApplicationStatus;
    location: string;
    workMode: WorkMode | undefined;
    salaryMin: string;
    salaryMax: string;
    salaryCurrency: string;
    techStack: string[];
    requirements: string[];
    niceToHaves: string[];
    benefits: string[];
    description: string;
    cheatsheet: string;
    notes: string;
    rating: number | undefined;
}

const initial = (): FormState => ({
    companyId: null,
    position: "",
    source: "linkedin",
    sourceUrl: "",
    status: "saved",
    location: "",
    workMode: undefined,
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "EUR",
    techStack: [],
    requirements: [],
    niceToHaves: [],
    benefits: [],
    description: "",
    cheatsheet: "",
    notes: "",
    rating: undefined,
});

const form = reactive<FormState>(initial());
const submitting = ref(false);

const statusOptions = APPLICATION_STATUS.map((s) => ({ value: s, label: t.status[s] }));
const sourceOptions = APPLICATION_SOURCE.map((s) => ({ value: s, label: t.source[s] }));
const workModeOptions = WORK_MODE.map((m) => ({ value: m, label: t.workMode[m] }));

const canSubmit = computed(
    () => form.companyId !== null && form.position.trim().length > 0,
);

const submit = async () => {
    if (!form.companyId || !form.position.trim()) {
        toast.error(t.common.validation.required);
        return;
    }
    submitting.value = true;
    try {
        const min = form.salaryMin ? Number(form.salaryMin) : undefined;
        const max = form.salaryMax ? Number(form.salaryMax) : undefined;
        const input: ApplicationCreateInput = {
            companyId: form.companyId,
            position: form.position.trim(),
            source: form.source,
            sourceUrl: form.sourceUrl.trim() || undefined,
            status: form.status,
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
            description: form.description.trim() || undefined,
            cheatsheet: form.cheatsheet.trim() || undefined,
            notes: form.notes.trim() || undefined,
            rating: form.rating,
            contacts: [],
        };
        const created = await applicationsStore.create(input);
        toast.success(t.toast.saved);
        emit("done", created);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    } finally {
        submitting.value = false;
    }
};
</script>

<template>
    <form class="flex flex-col gap-6" @submit.prevent="submit">
        <section>
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationForm.sections.basics }}
            </h3>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <ApplicationCompanyPicker v-model="form.companyId" required />
                <UiTextInput
                    v-model="form.position"
                    :label="t.applicationForm.fields.position"
                    :placeholder="t.applicationForm.placeholders.position"
                />
                <UiSelect
                    v-model="form.source"
                    :label="t.applicationForm.fields.source"
                    :options="sourceOptions"
                />
                <UiSelect
                    v-model="form.status"
                    :label="t.applicationForm.fields.status"
                    :options="statusOptions"
                />
                <UiTextInput
                    v-model="form.sourceUrl"
                    :label="t.applicationForm.fields.sourceUrl"
                    type="url"
                    icon="i-lucide-link"
                />
                <UiTextInput
                    v-model="form.location"
                    :label="t.applicationForm.fields.location"
                    icon="i-lucide-map-pin"
                />
                <UiSelect
                    v-model="form.workMode"
                    :label="t.applicationForm.fields.workMode"
                    :options="workModeOptions"
                    placeholder="—"
                />
                <div>
                    <span class="mb-1 block text-xs font-medium text-jt-fg-soft">
                        {{ t.applicationForm.fields.rating }}
                    </span>
                    <UiRating v-model="form.rating" />
                </div>
            </div>
        </section>

        <section>
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationForm.sections.compensation }}
            </h3>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                <UiTextInput
                    v-model="form.salaryMin"
                    :label="t.applicationForm.fields.salaryMin"
                    type="number"
                    inputmode="numeric"
                />
                <UiTextInput
                    v-model="form.salaryMax"
                    :label="t.applicationForm.fields.salaryMax"
                    type="number"
                    inputmode="numeric"
                />
                <UiTextInput
                    v-model="form.salaryCurrency"
                    :label="t.applicationForm.fields.salaryCurrency"
                />
            </div>
        </section>

        <section>
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationForm.sections.requirements }}
            </h3>
            <div class="grid grid-cols-1 gap-3">
                <UiTagInput v-model="form.techStack" :label="t.applicationForm.fields.techStack" />
                <UiTagInput v-model="form.requirements" :label="t.applicationForm.fields.requirements" />
                <UiTagInput v-model="form.niceToHaves" :label="t.applicationForm.fields.niceToHaves" />
                <UiTagInput v-model="form.benefits" :label="t.applicationForm.fields.benefits" />
            </div>
        </section>

        <section>
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationForm.sections.description }}
            </h3>
            <UiTextarea
                v-model="form.description"
                :label="t.applicationForm.fields.description"
                :rows="6"
            />
        </section>

        <section>
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationForm.sections.cheatsheet }}
            </h3>
            <UiTextarea
                v-model="form.cheatsheet"
                :label="t.applicationForm.fields.cheatsheet"
                :rows="8"
                monospace
            />
        </section>

        <section>
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationForm.sections.notes }}
            </h3>
            <UiTextarea
                v-model="form.notes"
                :label="t.applicationForm.fields.notes"
                :rows="4"
            />
        </section>

        <footer class="flex items-center justify-end gap-2">
            <UiButton
                type="submit"
                variant="brand"
                icon="i-lucide-check"
                :loading="submitting"
                :disabled="!canSubmit"
            >
                {{ t.applicationNew.manualSubmit }}
            </UiButton>
        </footer>
    </form>
</template>
