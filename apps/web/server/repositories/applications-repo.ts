import { randomUUID } from "node:crypto";
import type {
    Application,
    ApplicationCreateInput,
    ApplicationStatus,
    ApplicationUpdateInput,
    Contact,
    ContactCreateInput,
    ContactUpdateInput,
    Document,
    DocumentCreateInput,
    DocumentUpdateInput,
    OpenQuestion,
    OpenQuestionCreateInput,
    OpenQuestionUpdateInput,
    StatusChangeInput,
    TimelineEntry,
    TimelineEntryCreateInput,
} from "@job-tracker/shared";
import { canTransition } from "@job-tracker/shared";
import { dataFile } from "../utils/paths";
import { getStore } from "../utils/json-store";
import { conflict, notFound } from "../utils/errors";

interface ApplicationsFile {
    version: 1;
    applications: Application[];
}

const defaultFile: ApplicationsFile = { version: 1, applications: [] };

const store = () => getStore<ApplicationsFile>(dataFile("applications.json"), defaultFile);

const now = () => new Date().toISOString();

const stripUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) out[k] = v;
    }
    return out as Partial<T>;
};

const sortByUpdatedDesc = (a: Application, b: Application) =>
    b.updatedAt.localeCompare(a.updatedAt);

export interface ApplicationListFilters {
    status?: ApplicationStatus[];
    source?: string[];
    search?: string;
    includeArchived?: boolean;
    companyId?: string;
}

export const applicationsRepo = {
    async list(filters: ApplicationListFilters = {}): Promise<Application[]> {
        const data = await store().read();
        const search = filters.search?.trim().toLowerCase();
        let out = data.applications;

        if (!filters.includeArchived) {
            out = out.filter((a) => !a.archived);
        }
        if (filters.companyId) {
            out = out.filter((a) => a.companyId === filters.companyId);
        }
        if (filters.status && filters.status.length > 0) {
            const set = new Set(filters.status);
            out = out.filter((a) => set.has(a.status));
        }
        if (filters.source && filters.source.length > 0) {
            const set = new Set(filters.source);
            out = out.filter((a) => set.has(a.source));
        }
        if (search) {
            out = out.filter((a) => {
                const hay = [
                    a.position,
                    a.location ?? "",
                    a.cheatsheet ?? "",
                    a.notes ?? "",
                    ...a.techStack,
                    ...a.requirements,
                ]
                    .join(" \n ")
                    .toLowerCase();
                return hay.includes(search);
            });
        }
        return [...out].sort(sortByUpdatedDesc);
    },

    async findById(id: string): Promise<Application | null> {
        const data = await store().read();
        return data.applications.find((a) => a.id === id) ?? null;
    },

    async countByCompanyId(companyId: string): Promise<number> {
        const data = await store().read();
        return data.applications.filter((a) => a.companyId === companyId).length;
    },

    async create(input: ApplicationCreateInput): Promise<Application> {
        const ts = now();
        const initialStatus = input.status ?? "saved";
        const contacts: Contact[] = (input.contacts ?? []).map((c) => ({
            id: randomUUID(),
            createdAt: ts,
            name: c.name,
            role: c.role,
            email: c.email,
            phone: c.phone,
            linkedinUrl: c.linkedinUrl,
            notes: c.notes,
        }));
        const timeline: TimelineEntry[] = [
            {
                id: randomUUID(),
                type: "status_change",
                occurredAt: ts,
                title: `Status: ${initialStatus}`,
                toStatus: initialStatus,
            },
        ];
        const application: Application = {
            id: randomUUID(),
            companyId: input.companyId,
            position: input.position,
            source: input.source,
            sourceUrl: input.sourceUrl,
            status: initialStatus,
            appliedAt: input.appliedAt ?? (initialStatus === "applied" ? ts : undefined),
            nextFollowUpAt: input.nextFollowUpAt,
            location: input.location,
            workMode: input.workMode,
            salary: input.salary,
            techStack: input.techStack ?? [],
            requirements: input.requirements ?? [],
            niceToHaves: input.niceToHaves ?? [],
            benefits: input.benefits ?? [],
            description: input.description,
            cheatsheet: input.cheatsheet,
            notes: input.notes,
            rating: input.rating,
            contacts,
            timeline,
            documents: [],
            openQuestions: [],
            archived: false,
            createdAt: ts,
            updatedAt: ts,
        };
        await store().mutate((current) => ({
            ...current,
            applications: [...current.applications, application],
        }));
        return application;
    },

    async update(id: string, patch: ApplicationUpdateInput): Promise<Application> {
        const result = await updateInPlace(id, (app) => ({
            ...app,
            ...stripUndefined(patch),
            updatedAt: now(),
        }));
        return result;
    },

    async setArchived(id: string, archived: boolean): Promise<Application> {
        return updateInPlace(id, (app) => ({ ...app, archived, updatedAt: now() }));
    },

    async delete(id: string): Promise<boolean> {
        let deleted = false;
        await store().mutate((current) => {
            const before = current.applications.length;
            const next = current.applications.filter((a) => a.id !== id);
            deleted = next.length < before;
            return { ...current, applications: next };
        });
        return deleted;
    },

    async changeStatus(id: string, input: StatusChangeInput): Promise<Application> {
        return updateInPlace(id, (app) => {
            if (app.status === input.toStatus) return app;
            if (!canTransition(app.status, input.toStatus)) {
                throw conflict("Invalid status transition", {
                    from: app.status,
                    to: input.toStatus,
                });
            }
            const ts = input.occurredAt ?? now();
            const entry: TimelineEntry = {
                id: randomUUID(),
                type: "status_change",
                occurredAt: ts,
                title: `${app.status} → ${input.toStatus}`,
                description: input.note,
                fromStatus: app.status,
                toStatus: input.toStatus,
            };
            return {
                ...app,
                status: input.toStatus,
                appliedAt:
                    app.appliedAt ?? (input.toStatus === "applied" ? ts : app.appliedAt),
                timeline: [...app.timeline, entry],
                updatedAt: now(),
            };
        });
    },

    async addTimelineEntry(id: string, input: TimelineEntryCreateInput): Promise<Application> {
        return updateInPlace(id, (app) => {
            const entry: TimelineEntry = {
                id: randomUUID(),
                type: input.type,
                occurredAt: input.occurredAt ?? now(),
                title: input.title,
                description: input.description,
                fromStatus: input.fromStatus,
                toStatus: input.toStatus,
            };
            return {
                ...app,
                timeline: [...app.timeline, entry],
                updatedAt: now(),
            };
        });
    },

    async deleteTimelineEntry(id: string, entryId: string): Promise<Application> {
        return updateInPlace(id, (app) => ({
            ...app,
            timeline: app.timeline.filter((t) => t.id !== entryId),
            updatedAt: now(),
        }));
    },

    async addContact(id: string, input: ContactCreateInput): Promise<Application> {
        return updateInPlace(id, (app) => {
            const contact: Contact = {
                id: randomUUID(),
                createdAt: now(),
                name: input.name,
                role: input.role,
                email: input.email,
                phone: input.phone,
                linkedinUrl: input.linkedinUrl,
                notes: input.notes,
            };
            return {
                ...app,
                contacts: [...app.contacts, contact],
                updatedAt: now(),
            };
        });
    },

    async updateContact(
        id: string,
        contactId: string,
        patch: ContactUpdateInput,
    ): Promise<Application> {
        return updateInPlace(id, (app) => {
            const idx = app.contacts.findIndex((c) => c.id === contactId);
            if (idx === -1) throw notFound("Contact");
            const next = [...app.contacts];
            next[idx] = { ...next[idx]!, ...stripUndefined(patch) };
            return { ...app, contacts: next, updatedAt: now() };
        });
    },

    async deleteContact(id: string, contactId: string): Promise<Application> {
        return updateInPlace(id, (app) => ({
            ...app,
            contacts: app.contacts.filter((c) => c.id !== contactId),
            updatedAt: now(),
        }));
    },

    async addDocument(id: string, input: DocumentCreateInput): Promise<Application> {
        return updateInPlace(id, (app) => {
            const doc: Document = {
                id: randomUUID(),
                createdAt: now(),
                type: input.type,
                name: input.name,
                filename: input.filename,
                url: input.url,
                version: input.version,
                notes: input.notes,
            };
            return {
                ...app,
                documents: [...app.documents, doc],
                updatedAt: now(),
            };
        });
    },

    async updateDocument(
        id: string,
        documentId: string,
        patch: DocumentUpdateInput,
    ): Promise<Application> {
        return updateInPlace(id, (app) => {
            const idx = app.documents.findIndex((d) => d.id === documentId);
            if (idx === -1) throw notFound("Document");
            const next = [...app.documents];
            next[idx] = { ...next[idx]!, ...stripUndefined(patch) };
            return { ...app, documents: next, updatedAt: now() };
        });
    },

    async deleteDocument(id: string, documentId: string): Promise<Application> {
        return updateInPlace(id, (app) => ({
            ...app,
            documents: app.documents.filter((d) => d.id !== documentId),
            updatedAt: now(),
        }));
    },

    async addOpenQuestion(id: string, input: OpenQuestionCreateInput): Promise<Application> {
        return updateInPlace(id, (app) => {
            const q: OpenQuestion = {
                id: randomUUID(),
                createdAt: now(),
                question: input.question,
                answer: input.answer,
                askedAt: input.askedAt,
                answeredAt: input.answeredAt,
            };
            return {
                ...app,
                openQuestions: [...(app.openQuestions ?? []), q],
                updatedAt: now(),
            };
        });
    },

    async updateOpenQuestion(
        id: string,
        questionId: string,
        patch: OpenQuestionUpdateInput,
    ): Promise<Application> {
        return updateInPlace(id, (app) => {
            const list = app.openQuestions ?? [];
            const idx = list.findIndex((q) => q.id === questionId);
            if (idx === -1) throw notFound("Open question");
            const next = [...list];
            const merged = { ...next[idx]!, ...stripUndefined(patch) };
            if (patch.answer !== undefined && patch.answer.length > 0 && !merged.answeredAt) {
                merged.answeredAt = now();
            }
            next[idx] = merged;
            return { ...app, openQuestions: next, updatedAt: now() };
        });
    },

    async deleteOpenQuestion(id: string, questionId: string): Promise<Application> {
        return updateInPlace(id, (app) => ({
            ...app,
            openQuestions: (app.openQuestions ?? []).filter((q) => q.id !== questionId),
            updatedAt: now(),
        }));
    },
};

const updateInPlace = async (
    id: string,
    mutator: (app: Application) => Application,
): Promise<Application> => {
    let updated: Application | null = null;
    let err: unknown = null;
    await store().mutate((current) => {
        const idx = current.applications.findIndex((a) => a.id === id);
        if (idx === -1) {
            err = notFound("Application");
            return current;
        }
        try {
            const next = mutator(current.applications[idx]!);
            const list = [...current.applications];
            list[idx] = next;
            updated = next;
            return { ...current, applications: list };
        } catch (caught) {
            err = caught;
            return current;
        }
    });
    if (err) throw err;
    return updated!;
};
