<script setup lang="ts">
const t = useT();
const api = useApi();
const toast = useToast();
const confirm = useConfirm();
const settingsStore = useSettingsStore();

useHead({ title: t.settings.title });

await settingsStore.fetch();

const backupsResp = await useAsyncData("backups", () => api.data.backups());
const backups = computed(() => backupsResp.data.value?.dates ?? []);

const savingSettings = ref(false);
const settings = computed(() => settingsStore.data);

const updateSetting = async <K extends keyof NonNullable<typeof settings.value>>(
    key: K,
    value: NonNullable<typeof settings.value>[K],
) => {
    if (!settings.value) return;
    savingSettings.value = true;
    try {
        await settingsStore.update({ [key]: value });
        toast.success(t.toast.saved);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    } finally {
        savingSettings.value = false;
    }
};

const themeOptions = [
    { value: "dark" as const, label: t.settings.themeDark },
    { value: "light" as const, label: t.settings.themeLight },
];

const viewOptions = [
    { value: "kanban" as const, label: t.applications.viewKanban },
    { value: "list" as const, label: t.applications.viewList },
];

const followUpDays = computed({
    get: () => settings.value?.followUpDays ?? 7,
    set: (v: number) => updateSetting("followUpDays", v),
});

const dailyGoal = computed({
    get: () => settings.value?.dailyGoal ?? 15,
    set: (v: number) => updateSetting("dailyGoal", v),
});

const weeklyGoal = computed({
    get: () => settings.value?.weeklyGoal ?? 105,
    set: (v: number) => updateSetting("weeklyGoal", v),
});

const setWeeklyToDailyTimesSeven = () => {
    if (!settings.value) return;
    updateSetting("weeklyGoal", dailyGoal.value * 7);
};

const downloadExport = async () => {
    try {
        const data = await api.data.export();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `job-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(t.toast.copied);
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

const importFileInput = ref<HTMLInputElement | null>(null);
const importing = ref(false);

const startImport = () => importFileInput.value?.click();

const onImportFile = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    target.value = "";
    if (!file) return;

    const confirmed = await confirm.open({
        title: t.settings.import,
        body: t.settings.importDanger,
        confirmLabel: t.settings.import,
        variant: "danger",
    });
    if (!confirmed) return;

    importing.value = true;
    try {
        const text = await file.text();
        const bundle = JSON.parse(text);
        await api.data.import(bundle);
        toast.success(t.settings.importSuccess);
        await Promise.all([backupsResp.refresh(), settingsStore.fetch(true)]);
    } catch (err) {
        toast.error(`${t.settings.importError} ${extractErrorMessage(err)}`);
    } finally {
        importing.value = false;
    }
};
</script>

<template>
    <div class="mx-auto max-w-3xl">
        <LayoutPageHeader
            eyebrow="Konfiguration"
            :title="t.settings.title"
            subtitle="Theme, Workflow-Defaults und Daten-Management."
        />

        <div v-if="!settings" class="flex justify-center py-10">
            <UiSpinner :label="t.common.loading" />
        </div>
        <div v-else class="flex flex-col gap-4">
            <section class="jt-enter jt-enter-d100 rounded-2xl border border-jt-line bg-jt-surface p-5">
                <h2 class="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-jt-fg-muted">
                    {{ t.settings.sections.display }}
                </h2>
                <div class="flex flex-col divide-y divide-jt-line-faint">
                    <div class="flex items-center justify-between gap-4 py-3 first:pt-0">
                        <span class="text-sm text-jt-fg">{{ t.settings.theme }}</span>
                        <UiSegmented
                            :model-value="settings.theme"
                            :options="themeOptions"
                            @update:model-value="updateSetting('theme', $event)"
                        />
                    </div>
                    <div class="flex items-center justify-between gap-4 py-3 last:pb-0">
                        <span class="text-sm text-jt-fg">{{ t.settings.defaultView }}</span>
                        <UiSegmented
                            :model-value="settings.defaultView"
                            :options="viewOptions"
                            @update:model-value="updateSetting('defaultView', $event)"
                        />
                    </div>
                </div>
            </section>

            <section class="jt-enter jt-enter-d200 rounded-2xl border border-jt-line bg-jt-surface p-5">
                <h2 class="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-jt-fg-muted">
                    {{ t.settings.sections.workflow }}
                </h2>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <UiTextInput
                        :model-value="followUpDays"
                        :label="t.settings.followUpDays"
                        type="number"
                        min="1"
                        max="60"
                        @update:model-value="(v) => (followUpDays = Number(v))"
                    />
                    <UiTextInput
                        :model-value="dailyGoal"
                        label="Tagesziel (Bewerbungen pro Tag)"
                        type="number"
                        min="0"
                        max="50"
                        @update:model-value="(v) => (dailyGoal = Number(v))"
                    />
                    <UiTextInput
                        :model-value="weeklyGoal"
                        :label="t.settings.weeklyGoal"
                        type="number"
                        min="0"
                        max="500"
                        @update:model-value="(v) => (weeklyGoal = Number(v))"
                    />
                </div>
                <div class="mt-3 flex items-center justify-end">
                    <button
                        type="button"
                        class="inline-flex items-center gap-1 text-xs text-jt-brand hover:underline"
                        @click="setWeeklyToDailyTimesSeven"
                    >
                        <Icon name="i-lucide-zap" class="h-3 w-3" />
                        Wochenziel = Tagesziel × 7 ({{ dailyGoal * 7 }}) setzen
                    </button>
                </div>
            </section>

            <section class="jt-enter jt-enter-d300 rounded-2xl border border-jt-line bg-jt-surface p-5">
                <h2 class="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-jt-fg-muted">
                    {{ t.settings.sections.data }}
                </h2>
                <div class="flex flex-col gap-5">
                    <div>
                        <h3 class="text-sm font-medium text-jt-fg">{{ t.settings.export }}</h3>
                        <p class="mt-1 text-xs text-jt-fg-muted">{{ t.settings.exportHint }}</p>
                        <UiButton
                            class="mt-3"
                            variant="outline"
                            icon="i-lucide-download"
                            @click="downloadExport"
                        >
                            {{ t.settings.exportDownload }}
                        </UiButton>
                    </div>
                    <div class="border-t border-jt-line-faint pt-5">
                        <h3 class="text-sm font-medium text-jt-fg">{{ t.settings.import }}</h3>
                        <p class="mt-1 text-xs text-jt-fg-muted">{{ t.settings.importHint }}</p>
                        <input
                            ref="importFileInput"
                            type="file"
                            accept="application/json"
                            class="hidden"
                            @change="onImportFile"
                        />
                        <UiButton
                            class="mt-3"
                            variant="outline"
                            icon="i-lucide-upload"
                            :loading="importing"
                            @click="startImport"
                        >
                            {{ t.settings.importFile }}
                        </UiButton>
                    </div>
                    <div class="border-t border-jt-line-faint pt-5">
                        <h3 class="text-sm font-medium text-jt-fg">{{ t.settings.backups }}</h3>
                        <p class="mt-1 text-xs text-jt-fg-muted">{{ t.settings.backupsHint }}</p>
                        <ul v-if="backups.length > 0" class="mt-3 flex flex-wrap gap-1.5">
                            <li
                                v-for="date in backups"
                                :key="date"
                                class="tabular rounded-md border border-jt-line bg-jt-base px-2 py-1 font-mono text-[11px] text-jt-fg-soft"
                            >
                                {{ date }}
                            </li>
                        </ul>
                        <p v-else class="mt-3 text-xs italic text-jt-fg-faint">
                            {{ t.common.empty }}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>
