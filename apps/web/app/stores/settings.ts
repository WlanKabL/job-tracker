import { defineStore } from "pinia";
import type { Settings, SettingsUpdateInput } from "@job-tracker/shared";

export const useSettingsStore = defineStore("settings", () => {
    const api = useApi();
    const data = ref<Settings | null>(null);
    const loading = ref(false);

    const fetch = async (force = false) => {
        if (data.value && !force) return data.value;
        loading.value = true;
        try {
            data.value = await api.settings.get();
            return data.value;
        } finally {
            loading.value = false;
        }
    };

    const update = async (patch: SettingsUpdateInput) => {
        data.value = await api.settings.update(patch);
        return data.value;
    };

    return { data, loading, fetch, update };
});
