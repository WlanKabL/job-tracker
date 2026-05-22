import { defineStore } from "pinia";
import type { Company, CompanyCreateInput, CompanyUpdateInput } from "@job-tracker/shared";
import type { CompanyWithCount } from "~/composables/useApi";

export const useCompaniesStore = defineStore("companies", () => {
    const api = useApi();

    const items = ref<CompanyWithCount[]>([]);
    const loaded = ref(false);
    const loading = ref(false);

    const fetchAll = async (force = false) => {
        if (loaded.value && !force) return items.value;
        loading.value = true;
        try {
            items.value = await api.companies.list();
            loaded.value = true;
            return items.value;
        } finally {
            loading.value = false;
        }
    };

    const upsert = (company: Company) => {
        const idx = items.value.findIndex((c) => c.id === company.id);
        const prevCount = idx === -1 ? 0 : items.value[idx]!.applicationCount;
        const next: CompanyWithCount = { ...company, applicationCount: prevCount };
        if (idx === -1) items.value = [next, ...items.value];
        else items.value = items.value.map((c, i) => (i === idx ? next : c));
    };

    const removeLocal = (id: string) => {
        items.value = items.value.filter((c) => c.id !== id);
    };

    const create = async (input: CompanyCreateInput) => {
        const created = await api.companies.create(input);
        upsert(created);
        return created;
    };

    const update = async (id: string, patch: CompanyUpdateInput) => {
        const updated = await api.companies.update(id, patch);
        upsert(updated);
        return updated;
    };

    const remove = async (id: string) => {
        await api.companies.delete(id);
        removeLocal(id);
    };

    const findById = (id: string) => computed(() => items.value.find((c) => c.id === id) ?? null);

    return {
        items,
        loaded,
        loading,
        fetchAll,
        upsert,
        removeLocal,
        create,
        update,
        remove,
        findById,
    };
});
