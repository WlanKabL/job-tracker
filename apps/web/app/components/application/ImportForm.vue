<script setup lang="ts">
import type {
    Application,
    Company,
    ImportDriftReport,
    ImportPayload,
    PreprocessReport,
} from "@job-tracker/shared";
import {
    importPayloadSchema,
    preprocessImportPayload,
    stripCodeFences,
} from "@job-tracker/shared";

const t = useT();
const toast = useToast();
const api = useApi();
const applicationsStore = useApplicationsStore();
const companiesStore = useCompaniesStore();

const emit = defineEmits<{ done: [application: Application] }>();

interface PreviewState {
    payload: ImportPayload;
    preprocess: PreprocessReport;
}

interface ParseError {
    message: string;
    unexpectedFields?: string[];
    issues?: Array<{ path: string; message: string }>;
}

const raw = ref("");
const submitting = ref(false);
const parseError = ref<ParseError | null>(null);
const preview = ref<PreviewState | null>(null);
const lastDrift = ref<ImportDriftReport | null>(null);

const conflict = ref<{
    incomingCompany: { name: string; website?: string; industry?: string; location?: string };
    existingCompany: Company;
    payload: ImportPayload;
} | null>(null);

const parse = (): ImportPayload | null => {
    parseError.value = null;
    preview.value = null;
    const stripped = stripCodeFences(raw.value);
    if (!stripped) {
        parseError.value = { message: t.common.validation.invalidJson };
        return null;
    }
    let json: unknown;
    try {
        json = JSON.parse(stripped);
    } catch (e) {
        parseError.value = {
            message: `${t.common.validation.invalidJson}: ${(e as Error).message}`,
        };
        return null;
    }
    const { value, report } = preprocessImportPayload(json);
    const parsed = importPayloadSchema.safeParse(value);
    if (!parsed.success) {
        const unexpected: string[] = [];
        const issues: Array<{ path: string; message: string }> = [];
        for (const i of parsed.error.issues) {
            if (i.code === "unrecognized_keys") {
                unexpected.push(...((i as { keys?: string[] }).keys ?? []));
            } else {
                issues.push({ path: i.path.join(".") || "(root)", message: i.message });
            }
        }
        parseError.value = {
            message:
                unexpected.length > 0 && issues.length === 0
                    ? "ChatGPT lieferte unbekannte Felder."
                    : "JSON entspricht nicht dem Schema.",
            unexpectedFields: unexpected.length > 0 ? unexpected : undefined,
            issues: issues.length > 0 ? issues : undefined,
        };
        return null;
    }
    preview.value = { payload: parsed.data, preprocess: report };
    return parsed.data;
};

const validate = () => {
    const payload = parse();
    if (payload) toast.success(t.applicationNew.importValid);
};

const submit = async (
    resolveStrategy?: { strategy: "create_new" | "reuse_existing"; existingCompanyId?: string },
) => {
    const payload = preview.value?.payload ?? parse();
    if (!payload) return;

    submitting.value = true;
    try {
        const result = await api.applications.import(payload, resolveStrategy);
        toast.success(t.toast.imported);
        // Company first so the application upsert can resolve its joined company immediately.
        companiesStore.upsert(result.company);
        applicationsStore.upsert(result.application);
        lastDrift.value = result.drift;
        emit("done", result.application);
    } catch (err: unknown) {
        const e = err as {
            statusCode?: number;
            data?: {
                data?: {
                    details?: {
                        reason?: string;
                        existingCompany?: Company;
                        incomingCompany?: {
                            name: string;
                            website?: string;
                            industry?: string;
                            location?: string;
                        };
                        unexpectedFields?: string[];
                        hint?: string;
                    };
                };
            };
        };
        const details = e.data?.data?.details;
        if (
            e.statusCode === 409 &&
            details?.reason === "company_name_conflict" &&
            details.existingCompany &&
            details.incomingCompany
        ) {
            conflict.value = {
                incomingCompany: details.incomingCompany,
                existingCompany: details.existingCompany,
                payload,
            };
            return;
        }
        if (e.statusCode === 400 && details?.reason === "unexpected_fields") {
            parseError.value = {
                message: "ChatGPT lieferte unbekannte Felder.",
                unexpectedFields: details.unexpectedFields,
            };
            return;
        }
        toast.error(extractErrorMessage(err));
    } finally {
        submitting.value = false;
    }
};

const onReuse = (companyId: string) => {
    if (!conflict.value) return;
    conflict.value = null;
    submit({ strategy: "reuse_existing", existingCompanyId: companyId });
};

const onCreateNew = () => {
    if (!conflict.value) return;
    conflict.value = null;
    submit({ strategy: "create_new" });
};

const previewPreprocessActions = computed(() => {
    const r = preview.value?.preprocess;
    if (!r) return [];
    const out: string[] = [];
    if (r.unwrappedLinks.length > 0) {
        out.push(`${r.unwrappedLinks.length} Markdown-Link${r.unwrappedLinks.length === 1 ? "" : "s"} entpackt`);
    }
    if (r.strippedPlaceholders.length > 0) {
        out.push(
            `${r.strippedPlaceholders.length} [Klären:]-Platzhalter entfernt`,
        );
    }
    if (r.unwrappedQuestionMarkers.length > 0) {
        out.push(
            `${r.unwrappedQuestionMarkers.length} Frage(n) aus [Klären:]-Wrapper extrahiert`,
        );
    }
    return out;
});
</script>

<template>
    <div class="flex flex-col gap-3">
        <UiTextarea
            v-model="raw"
            :placeholder="t.applicationNew.importPlaceholder"
            :rows="14"
            monospace
        />
        <p class="text-xs text-jt-fg-muted">
            {{ t.applicationNew.importHint }}
            <NuxtLink to="/prompts" class="text-jt-brand hover:underline">
                {{ t.applicationNew.gotoPrompts }}
            </NuxtLink>
        </p>

        <div
            v-if="parseError"
            class="rounded-md border border-jt-danger/30 bg-jt-danger-soft p-3 text-sm text-jt-danger"
        >
            <div class="flex items-start gap-2">
                <Icon name="i-lucide-alert-circle" class="mt-0.5 h-4 w-4 shrink-0" />
                <div class="min-w-0 flex-1">
                    <p class="font-medium">{{ parseError.message }}</p>
                    <div v-if="parseError.unexpectedFields" class="mt-2">
                        <p class="text-xs">Unbekannte Top-Level-Felder:</p>
                        <ul class="ml-4 mt-1 list-disc text-xs">
                            <li v-for="f in parseError.unexpectedFields" :key="f">
                                <code class="font-mono">{{ f }}</code>
                            </li>
                        </ul>
                        <p class="mt-2 text-xs italic">
                            Tipp: Extract-Prompt in der Bibliothek aktualisieren oder die Felder
                            händisch aus dem JSON entfernen.
                        </p>
                    </div>
                    <ul v-if="parseError.issues" class="ml-4 mt-2 list-disc space-y-0.5 text-xs">
                        <li v-for="(i, idx) in parseError.issues" :key="idx">
                            <code class="font-mono">{{ i.path }}</code>: {{ i.message }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div
            v-if="preview"
            class="rounded-md border border-jt-success/30 bg-jt-success-soft p-3 text-sm text-jt-success"
        >
            <div class="flex items-start gap-2">
                <Icon name="i-lucide-check-circle-2" class="mt-0.5 h-4 w-4 shrink-0" />
                <div class="min-w-0 flex-1">
                    <div class="font-medium">{{ preview.payload.position }}</div>
                    <div class="text-xs">
                        {{ preview.payload.company.name }}
                        <span v-if="preview.payload.location"> · {{ preview.payload.location }}</span>
                    </div>
                    <div
                        v-if="previewPreprocessActions.length > 0"
                        class="mt-2 text-xs text-jt-fg-soft"
                    >
                        Auto-Fix: {{ previewPreprocessActions.join(" · ") }}
                    </div>
                </div>
            </div>
        </div>

        <div
            v-if="lastDrift && !preview"
            class="rounded-md border border-jt-info/30 bg-jt-info-soft p-3 text-xs text-jt-info"
        >
            <p class="mb-1 font-medium">Import-Report:</p>
            <ul v-if="lastDrift.mappings.length > 0" class="ml-4 list-disc space-y-0.5">
                <li v-for="(m, idx) in lastDrift.mappings" :key="idx">{{ m }}</li>
            </ul>
        </div>

        <div class="flex items-center justify-end gap-2">
            <UiButton variant="outline" icon="i-lucide-check-circle-2" @click="validate">
                {{ t.applicationNew.importValidate }}
            </UiButton>
            <UiButton
                variant="brand"
                icon="i-lucide-upload"
                :loading="submitting"
                @click="() => submit()"
            >
                {{ t.applicationNew.importSubmit }}
            </UiButton>
        </div>

        <ApplicationCompanyResolverModal
            :open="conflict !== null"
            :incoming-company="conflict?.incomingCompany ?? null"
            :existing-company="conflict?.existingCompany ?? null"
            @close="conflict = null"
            @reuse="onReuse"
            @create-new="onCreateNew"
        />
    </div>
</template>
