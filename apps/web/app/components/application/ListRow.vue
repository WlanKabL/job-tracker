<script setup lang="ts">
import type { ApplicationWithCompany } from "~/composables/useApi";

interface Props {
    application: ApplicationWithCompany;
}

const props = defineProps<Props>();
const t = useT();

const appliedLabel = computed(() =>
    formatRelative(props.application.appliedAt ?? props.application.createdAt),
);
const salaryLabel = computed(() =>
    formatSalaryRange(
        props.application.salary?.min,
        props.application.salary?.max,
        props.application.salary?.currency ?? "EUR",
    ),
);
const techPreview = computed(() => props.application.techStack.slice(0, 5));
const techOverflow = computed(() =>
    props.application.techStack.length > 5 ? props.application.techStack.length - 5 : 0,
);

const openQuestionsOpen = computed(
    () => (props.application.openQuestions ?? []).filter((q) => !q.answer).length,
);
const contactCount = computed(() => props.application.contacts.length);
const followUpDays = computed(() => {
    if (!props.application.nextFollowUpAt) return null;
    return daysBetween(props.application.nextFollowUpAt);
});
</script>

<template>
    <NuxtLink
        :to="`/applications/${application.id}`"
        class="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-jt-line bg-jt-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-jt-fg-faint hover:bg-jt-surface-hover"
    >
        <div
            aria-hidden="true"
            class="absolute inset-y-0 left-0 w-[2px] origin-left scale-y-0 bg-jt-brand transition-transform duration-200 group-hover:scale-y-100"
        ></div>

        <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5">
                    <span
                        v-if="application.archived"
                        class="rounded-md bg-jt-surface-raised px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-jt-fg-faint"
                    >
                        {{ t.common.archived }}
                    </span>
                    <span class="font-display truncate text-[17px] leading-snug text-jt-fg">
                        {{ application.position }}
                    </span>
                </div>
                <p class="mt-1 truncate text-sm text-jt-fg-muted">
                    <span class="text-jt-fg-soft">
                        {{ application.company?.name ?? t.common.unknown }}
                    </span>
                    <span v-if="application.location" class="text-jt-fg-faint">
                        · {{ application.location }}
                    </span>
                </p>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1.5">
                <UiStatusBadge :status="application.status" />
                <UiRating
                    v-if="application.rating"
                    :model-value="application.rating"
                    readonly
                    size="sm"
                />
            </div>
        </div>

        <div class="flex flex-wrap items-center gap-1.5 text-xs text-jt-fg-muted">
            <UiSourceBadge :source="application.source" size="sm" />
            <span
                v-if="application.workMode"
                class="rounded-md border border-jt-line bg-jt-base px-1.5 py-0.5"
            >
                {{ t.workMode[application.workMode] }}
            </span>
            <span
                v-if="salaryLabel"
                class="tabular rounded-md border border-jt-line bg-jt-base px-1.5 py-0.5"
            >
                {{ salaryLabel }}
            </span>
            <span
                v-if="openQuestionsOpen > 0"
                class="tabular inline-flex items-center gap-0.5 rounded-md border border-jt-warning/40 bg-jt-warning-soft px-1.5 py-0.5 text-jt-warning"
                title="Offene Fragen"
            >
                <Icon name="i-lucide-help-circle" class="h-3 w-3" />
                {{ openQuestionsOpen }}
            </span>
            <span
                v-if="contactCount > 0"
                class="tabular inline-flex items-center gap-0.5 rounded-md border border-jt-line bg-jt-base px-1.5 py-0.5"
                title="Kontakte"
            >
                <Icon name="i-lucide-users" class="h-3 w-3" />
                {{ contactCount }}
            </span>
            <span
                v-if="followUpDays !== null"
                :class="[
                    'tabular inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5',
                    followUpDays < 0
                        ? 'border border-jt-danger/40 bg-jt-danger-soft text-jt-danger'
                        : followUpDays <= 3
                          ? 'border border-jt-warning/40 bg-jt-warning-soft text-jt-warning'
                          : 'border border-jt-line bg-jt-base',
                ]"
                title="Nächstes Follow-Up"
            >
                <Icon name="i-lucide-alarm-clock" class="h-3 w-3" />
                {{ followUpDays < 0 ? `${Math.abs(followUpDays)}d überfällig` : `${followUpDays}d` }}
            </span>
            <span class="ml-auto whitespace-nowrap font-mono text-[10px] tracking-wide text-jt-fg-faint">
                {{ appliedLabel }}
            </span>
        </div>

        <div v-if="techPreview.length > 0" class="flex flex-wrap gap-1">
            <span
                v-for="tech in techPreview"
                :key="tech"
                class="rounded-md bg-jt-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-jt-brand"
            >
                {{ tech }}
            </span>
            <span v-if="techOverflow" class="text-[11px] text-jt-fg-faint">+{{ techOverflow }}</span>
        </div>
    </NuxtLink>
</template>
