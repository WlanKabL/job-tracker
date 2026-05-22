<script setup lang="ts">
import type { ApplicationWithCompany } from "~/composables/useApi";

interface Props {
    application: ApplicationWithCompany;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    "open-description": [];
}>();

const t = useT();

const salaryLabel = computed(() =>
    formatSalaryRange(
        props.application.salary?.min,
        props.application.salary?.max,
        props.application.salary?.currency ?? "EUR",
    ),
);

interface Row {
    label: string;
    value: string;
    icon?: string;
    href?: string;
}

const rows = computed<Row[]>(() => {
    const r: Row[] = [];
    if (props.application.appliedAt) {
        r.push({
            label: t.applicationDetail.meta.appliedAt,
            value: formatDate(props.application.appliedAt),
            icon: "i-lucide-calendar-check",
        });
    }
    if (props.application.nextFollowUpAt) {
        r.push({
            label: t.applicationDetail.meta.nextFollowUp,
            value: `${formatDate(props.application.nextFollowUpAt)} · ${formatRelative(props.application.nextFollowUpAt)}`,
            icon: "i-lucide-alarm-clock",
        });
    }
    if (props.application.location) {
        r.push({
            label: t.applicationDetail.meta.location,
            value: props.application.location,
            icon: "i-lucide-map-pin",
        });
    }
    if (props.application.workMode) {
        r.push({
            label: t.applicationDetail.meta.workMode,
            value: t.workMode[props.application.workMode],
            icon: "i-lucide-laptop",
        });
    }
    if (salaryLabel.value) {
        r.push({
            label: t.applicationDetail.meta.salary,
            value: salaryLabel.value,
            icon: "i-lucide-banknote",
        });
    }
    if (props.application.sourceUrl) {
        r.push({
            label: t.applicationForm.fields.sourceUrl,
            value: props.application.sourceUrl,
            icon: "i-lucide-link",
            href: props.application.sourceUrl,
        });
    }
    return r;
});

const company = computed(() => props.application.company);

const companyChips = computed(() => {
    const c = company.value;
    if (!c) return [];
    const chips: Array<{ icon: string; label: string }> = [];
    if (c.industry) chips.push({ icon: "i-lucide-tag", label: c.industry });
    if (c.size) chips.push({ icon: "i-lucide-users", label: t.companySize[c.size] });
    if (c.location) chips.push({ icon: "i-lucide-map-pin", label: c.location });
    return chips;
});

const DESCRIPTION_PREVIEW_LIMIT = 600;
const descriptionPreview = computed(() => {
    const desc = props.application.description ?? "";
    if (!desc.trim()) return null;
    const trimmed = desc.trim();
    if (trimmed.length <= DESCRIPTION_PREVIEW_LIMIT) {
        return { text: trimmed, truncated: false };
    }
    const cut = trimmed.slice(0, DESCRIPTION_PREVIEW_LIMIT);
    const lastSpace = cut.lastIndexOf(" ");
    return {
        text: (lastSpace > 400 ? cut.slice(0, lastSpace) : cut) + "…",
        truncated: true,
    };
});

const openQuestionsCount = computed(() => props.application.openQuestions?.length ?? 0);
const openQuestionsUnanswered = computed(
    () => (props.application.openQuestions ?? []).filter((q) => !q.answer).length,
);
</script>

<template>
    <div class="flex flex-col gap-5">
        <section
            v-if="company"
            class="rounded-lg border border-jt-line bg-jt-base px-4 py-3"
        >
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-[11px] uppercase tracking-wider text-jt-fg-muted">
                        {{ t.applicationDetail.meta.company }}
                    </p>
                    <NuxtLink
                        :to="`/companies/${company.id}`"
                        class="text-base font-semibold text-jt-fg hover:underline"
                    >
                        {{ company.name }}
                    </NuxtLink>
                </div>
                <a
                    v-if="company.website"
                    :href="company.website"
                    target="_blank"
                    rel="noreferrer noopener"
                    class="inline-flex items-center gap-1 text-xs text-jt-brand hover:underline"
                >
                    <Icon name="i-lucide-external-link" class="h-3 w-3" />
                    {{ company.website.replace(/^https?:\/\//, "").replace(/\/$/, "") }}
                </a>
            </div>
            <div v-if="companyChips.length > 0" class="mt-2 flex flex-wrap gap-1.5">
                <span
                    v-for="chip in companyChips"
                    :key="chip.label"
                    class="inline-flex items-center gap-1 rounded-md border border-jt-line bg-jt-surface px-2 py-0.5 text-xs text-jt-fg-soft"
                >
                    <Icon :name="chip.icon" class="h-3 w-3" />
                    {{ chip.label }}
                </span>
            </div>
        </section>

        <dl v-if="rows.length > 0" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
                v-for="row in rows"
                :key="row.label"
                class="rounded-md border border-jt-line bg-jt-surface px-3 py-2"
            >
                <dt class="flex items-center gap-1.5 text-xs uppercase tracking-wide text-jt-fg-muted">
                    <Icon v-if="row.icon" :name="row.icon" class="h-3 w-3" />
                    {{ row.label }}
                </dt>
                <dd class="mt-1 text-sm text-jt-fg break-words">
                    <a
                        v-if="row.href"
                        :href="row.href"
                        target="_blank"
                        rel="noreferrer noopener"
                        class="text-jt-brand hover:underline"
                    >
                        {{ row.value }}
                    </a>
                    <template v-else>{{ row.value }}</template>
                </dd>
            </div>
        </dl>

        <div
            v-if="openQuestionsCount > 0"
            class="flex items-center justify-between gap-3 rounded-lg border border-jt-warning/30 bg-jt-warning-soft px-4 py-3"
        >
            <div class="flex items-center gap-2">
                <Icon name="i-lucide-help-circle" class="h-4 w-4 text-jt-warning" />
                <span class="text-sm font-medium text-jt-fg">
                    {{ t.applicationDetail.meta.openQuestionsHeading }}
                </span>
                <span class="text-xs text-jt-fg-muted">
                    {{ openQuestionsUnanswered }} / {{ openQuestionsCount }} {{ t.openQuestions.unanswered }}
                </span>
            </div>
            <span class="text-xs italic text-jt-fg-faint">
                {{ t.applicationDetail.meta.openQuestionsHint }}
            </span>
        </div>

        <div v-if="application.rating">
            <h4 class="mb-1 text-xs uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationDetail.meta.rating }}
            </h4>
            <UiRating :model-value="application.rating" readonly />
        </div>

        <div v-if="application.techStack.length > 0">
            <h4 class="mb-2 text-xs uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationDetail.meta.techStack }}
            </h4>
            <div class="flex flex-wrap gap-1.5">
                <UiBadge v-for="tech in application.techStack" :key="tech" variant="brand">
                    {{ tech }}
                </UiBadge>
            </div>
        </div>

        <div v-if="application.requirements.length > 0">
            <h4 class="mb-2 text-xs uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationDetail.meta.requirements }}
            </h4>
            <ul class="ml-5 list-disc space-y-1 text-sm text-jt-fg-soft">
                <li v-for="req in application.requirements" :key="req">{{ req }}</li>
            </ul>
        </div>

        <div v-if="application.niceToHaves.length > 0">
            <h4 class="mb-2 text-xs uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationDetail.meta.niceToHaves }}
            </h4>
            <ul class="ml-5 list-disc space-y-1 text-sm text-jt-fg-soft">
                <li v-for="x in application.niceToHaves" :key="x">{{ x }}</li>
            </ul>
        </div>

        <div v-if="application.benefits.length > 0">
            <h4 class="mb-2 text-xs uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationDetail.meta.benefits }}
            </h4>
            <ul class="ml-5 list-disc space-y-1 text-sm text-jt-fg-soft">
                <li v-for="x in application.benefits" :key="x">{{ x }}</li>
            </ul>
        </div>

        <div v-if="descriptionPreview">
            <div class="mb-2 flex items-center justify-between gap-2">
                <h4 class="text-xs uppercase tracking-wide text-jt-fg-muted">
                    {{ t.applicationDetail.meta.description }}
                </h4>
                <button
                    v-if="descriptionPreview.truncated"
                    type="button"
                    class="inline-flex items-center gap-1 text-xs text-jt-brand hover:underline"
                    @click="emit('open-description')"
                >
                    {{ t.applicationDetail.meta.descriptionReadMore }}
                    <Icon name="i-lucide-arrow-right" class="h-3 w-3" />
                </button>
            </div>
            <p class="whitespace-pre-line text-sm text-jt-fg-soft">
                {{ descriptionPreview.text }}
            </p>
        </div>

        <div v-if="application.notes">
            <h4 class="mb-2 text-xs uppercase tracking-wide text-jt-fg-muted">
                {{ t.applicationForm.fields.notes }}
            </h4>
            <p class="whitespace-pre-line text-sm text-jt-fg-soft">{{ application.notes }}</p>
        </div>

        <div class="flex flex-wrap gap-x-4 gap-y-1 border-t border-jt-line-faint pt-3 text-xs text-jt-fg-faint">
            <span>{{ t.applicationDetail.meta.createdAt }}: {{ formatDateTime(application.createdAt) }}</span>
            <span>{{ t.applicationDetail.meta.updatedAt }}: {{ formatDateTime(application.updatedAt) }}</span>
        </div>
    </div>
</template>
