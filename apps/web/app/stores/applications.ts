import { defineStore } from "pinia";
import type {
    Application,
    ApplicationCreateInput,
    ApplicationSource,
    ApplicationStatus,
    ApplicationUpdateInput,
    StatusChangeInput,
} from "@job-tracker/shared";
import type { ApplicationWithCompany } from "~/composables/useApi";

export interface ListFilters {
    status: ApplicationStatus[];
    source: ApplicationSource[];
    search: string;
    includeArchived: boolean;
}

const emptyFilters = (): ListFilters => ({
    status: [],
    source: [],
    search: "",
    includeArchived: false,
});

export const useApplicationsStore = defineStore("applications", () => {
    const api = useApi();

    const items = ref<ApplicationWithCompany[]>([]);
    const loaded = ref(false);
    const loading = ref(false);
    const filters = reactive<ListFilters>(emptyFilters());

    const fetchAll = async (force = false) => {
        if (loaded.value && !force) return items.value;
        loading.value = true;
        try {
            items.value = await api.applications.listWithCompany({ includeArchived: true });
            loaded.value = true;
            return items.value;
        } finally {
            loading.value = false;
        }
    };

    const filtered = computed<ApplicationWithCompany[]>(() => {
        let out = items.value;
        if (!filters.includeArchived) out = out.filter((a) => !a.archived);
        if (filters.status.length > 0) {
            const set = new Set(filters.status);
            out = out.filter((a) => set.has(a.status));
        }
        if (filters.source.length > 0) {
            const set = new Set(filters.source);
            out = out.filter((a) => set.has(a.source));
        }
        const search = filters.search.trim().toLowerCase();
        if (search) {
            out = out.filter((a) => {
                const hay = [
                    a.position,
                    a.company?.name ?? "",
                    a.location ?? "",
                    a.notes ?? "",
                    a.cheatsheet ?? "",
                    ...a.techStack,
                    ...a.requirements,
                ]
                    .join(" ")
                    .toLowerCase();
                return hay.includes(search);
            });
        }
        return out;
    });

    const resetFilters = () => {
        Object.assign(filters, emptyFilters());
    };

    const upsert = (next: Application) => {
        const companiesStore = useCompaniesStore();
        const idx = items.value.findIndex((a) => a.id === next.id);
        const existingCompany = idx === -1 ? null : items.value[idx]!.company;
        // Create/import responses carry no joined company, so a freshly upserted row would
        // show "Unbekannt" until a full reload. Resolve it from the companies store instead.
        const company =
            existingCompany ?? companiesStore.items.find((c) => c.id === next.companyId) ?? null;
        const merged: ApplicationWithCompany = { ...next, company };
        if (idx === -1) items.value = [merged, ...items.value];
        else items.value = items.value.map((a, i) => (i === idx ? merged : a));
    };

    const removeLocal = (id: string) => {
        items.value = items.value.filter((a) => a.id !== id);
    };

    const create = async (input: ApplicationCreateInput) => {
        const created = await api.applications.create(input);
        upsert(created);
        return created;
    };

    const update = async (id: string, patch: ApplicationUpdateInput) => {
        const updated = await api.applications.update(id, patch);
        upsert(updated);
        return updated;
    };

    const remove = async (id: string) => {
        await api.applications.delete(id);
        removeLocal(id);
    };

    const setArchived = async (id: string, archived: boolean) => {
        const updated = await api.applications.setArchived(id, archived);
        upsert(updated);
        return updated;
    };

    const changeStatus = async (id: string, input: StatusChangeInput) => {
        const updated = await api.applications.changeStatus(id, input);
        upsert(updated);
        return updated;
    };

    return {
        items,
        loaded,
        loading,
        filters,
        filtered,
        fetchAll,
        resetFilters,
        upsert,
        removeLocal,
        create,
        update,
        remove,
        setArchived,
        changeStatus,
    };
});
