import type {
    Application,
    ApplicationCreateInput,
    ApplicationSource,
    ApplicationStatus,
    ApplicationUpdateInput,
    Company,
    CompanyCreateInput,
    CompanyResolveInput,
    CompanyUpdateInput,
    ContactCreateInput,
    ContactUpdateInput,
    DocumentCreateInput,
    DocumentUpdateInput,
    ImportDriftReport,
    ImportPayload,
    OpenQuestionCreateInput,
    OpenQuestionUpdateInput,
    Settings,
    SettingsUpdateInput,
    StatsResponse,
    StatusChangeInput,
    TimelineEntryCreateInput,
} from "@job-tracker/shared";

export interface ApplicationListQuery {
    status?: ApplicationStatus[];
    source?: ApplicationSource[];
    search?: string;
    includeArchived?: boolean;
    companyId?: string;
    embed?: boolean;
}

export interface ApplicationWithCompany extends Application {
    company: Company | null;
}

export interface CompanyWithCount extends Company {
    applicationCount: number;
}

export interface CompanyDetail extends Company {
    applications: Application[];
}

export interface ImportResponse {
    application: Application;
    company: Company;
    reusedExistingCompany: boolean;
    drift: ImportDriftReport;
}

export interface ResolveCompanyResponse {
    match: Company | null;
}

export interface PromptsResponse {
    prompts: Record<
        "extract" | "cheatsheet" | "coverLetter" | "followUp" | "salary" | "successProbability",
        { id: string; template: string }
    >;
    schemaExample: string;
}

const toCsv = (arr?: string[]) => (arr && arr.length > 0 ? arr.join(",") : undefined);

const buildQuery = (q?: ApplicationListQuery): Record<string, string | boolean | undefined> => {
    if (!q) return {};
    return {
        status: toCsv(q.status),
        source: toCsv(q.source),
        search: q.search?.trim() ? q.search.trim() : undefined,
        includeArchived: q.includeArchived ? true : undefined,
        companyId: q.companyId,
        embed: q.embed ? true : undefined,
    };
};

export const apiClient = {
    applications: {
        list: (query?: ApplicationListQuery) =>
            $fetch<Application[]>("/api/applications", { query: buildQuery(query) }),
        listWithCompany: (query?: ApplicationListQuery) =>
            $fetch<ApplicationWithCompany[]>("/api/applications", {
                query: buildQuery({ ...query, embed: true }),
            }),
        get: (id: string) => $fetch<ApplicationWithCompany>(`/api/applications/${id}`),
        create: (input: ApplicationCreateInput) =>
            $fetch<Application>("/api/applications", { method: "POST", body: input }),
        update: (id: string, patch: ApplicationUpdateInput) =>
            $fetch<Application>(`/api/applications/${id}`, { method: "PATCH", body: patch }),
        delete: (id: string) =>
            $fetch<{ id: string; deleted: true }>(`/api/applications/${id}`, {
                method: "DELETE",
            }),
        changeStatus: (id: string, input: StatusChangeInput) =>
            $fetch<Application>(`/api/applications/${id}/status`, {
                method: "POST",
                body: input,
            }),
        setArchived: (id: string, archived: boolean) =>
            $fetch<Application>(`/api/applications/${id}/archive`, {
                method: "POST",
                body: { archived },
            }),
        addTimelineEntry: (id: string, input: TimelineEntryCreateInput) =>
            $fetch<Application>(`/api/applications/${id}/timeline`, {
                method: "POST",
                body: input,
            }),
        deleteTimelineEntry: (id: string, entryId: string) =>
            $fetch<Application>(`/api/applications/${id}/timeline/${entryId}`, {
                method: "DELETE",
            }),
        addContact: (id: string, input: ContactCreateInput) =>
            $fetch<Application>(`/api/applications/${id}/contacts`, {
                method: "POST",
                body: input,
            }),
        updateContact: (id: string, contactId: string, patch: ContactUpdateInput) =>
            $fetch<Application>(`/api/applications/${id}/contacts/${contactId}`, {
                method: "PATCH",
                body: patch,
            }),
        deleteContact: (id: string, contactId: string) =>
            $fetch<Application>(`/api/applications/${id}/contacts/${contactId}`, {
                method: "DELETE",
            }),
        addDocument: (id: string, input: DocumentCreateInput) =>
            $fetch<Application>(`/api/applications/${id}/documents`, {
                method: "POST",
                body: input,
            }),
        updateDocument: (id: string, documentId: string, patch: DocumentUpdateInput) =>
            $fetch<Application>(`/api/applications/${id}/documents/${documentId}`, {
                method: "PATCH",
                body: patch,
            }),
        deleteDocument: (id: string, documentId: string) =>
            $fetch<Application>(`/api/applications/${id}/documents/${documentId}`, {
                method: "DELETE",
            }),
        addOpenQuestion: (id: string, input: OpenQuestionCreateInput) =>
            $fetch<Application>(`/api/applications/${id}/open-questions`, {
                method: "POST",
                body: input,
            }),
        updateOpenQuestion: (id: string, questionId: string, patch: OpenQuestionUpdateInput) =>
            $fetch<Application>(`/api/applications/${id}/open-questions/${questionId}`, {
                method: "PATCH",
                body: patch,
            }),
        deleteOpenQuestion: (id: string, questionId: string) =>
            $fetch<Application>(`/api/applications/${id}/open-questions/${questionId}`, {
                method: "DELETE",
            }),
        import: (payload: ImportPayload, resolve?: CompanyResolveInput) =>
            $fetch<ImportResponse>("/api/applications/import", {
                method: "POST",
                body: { payload, resolve },
            }),
        resolveCompanyName: (name: string) =>
            $fetch<ResolveCompanyResponse>("/api/applications/resolve-company", {
                method: "POST",
                body: { name },
            }),
    },
    companies: {
        list: () => $fetch<CompanyWithCount[]>("/api/companies"),
        get: (id: string) => $fetch<CompanyDetail>(`/api/companies/${id}`),
        create: (input: CompanyCreateInput) =>
            $fetch<Company>("/api/companies", { method: "POST", body: input }),
        update: (id: string, patch: CompanyUpdateInput) =>
            $fetch<Company>(`/api/companies/${id}`, { method: "PATCH", body: patch }),
        delete: (id: string) =>
            $fetch<{ id: string; deleted: true }>(`/api/companies/${id}`, { method: "DELETE" }),
    },
    stats: {
        get: () => $fetch<StatsResponse>("/api/stats"),
    },
    settings: {
        get: () => $fetch<Settings>("/api/settings"),
        update: (patch: SettingsUpdateInput) =>
            $fetch<Settings>("/api/settings", { method: "PATCH", body: patch }),
    },
    data: {
        export: () => $fetch<Record<string, unknown>>("/api/export"),
        import: (bundle: Record<string, unknown>) =>
            $fetch<{ imported: true; counts: { companies: number; applications: number } }>(
                "/api/import",
                { method: "POST", body: bundle },
            ),
        backups: () => $fetch<{ dates: string[] }>("/api/backups"),
    },
    prompts: {
        get: () => $fetch<PromptsResponse>("/api/prompts"),
    },
};

export const useApi = () => apiClient;

/** Extracts a readable error message from a $fetch error. */
export const extractErrorMessage = (err: unknown): string => {
    if (!err || typeof err !== "object") return String(err);
    const e = err as {
        data?: {
            message?: string;
            data?: { message?: string; issues?: Array<{ message: string }> };
            issues?: Array<{ message: string }>;
        };
        statusMessage?: string;
        message?: string;
    };
    const issues = e.data?.data?.issues ?? e.data?.issues;
    if (issues?.length) {
        return issues.map((i) => i.message).join("; ");
    }
    return (
        e.data?.data?.message ??
        e.data?.message ??
        e.statusMessage ??
        e.message ??
        "Unbekannter Fehler"
    );
};
