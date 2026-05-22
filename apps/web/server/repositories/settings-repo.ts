import type { Settings, SettingsUpdateInput } from "@job-tracker/shared";
import { settingsSchema } from "@job-tracker/shared";
import { dataFile } from "../utils/paths";
import { getStore } from "../utils/json-store";

const defaultSettings: Settings = settingsSchema.parse({});

const store = () => getStore<Settings>(dataFile("settings.json"), defaultSettings);

export const settingsRepo = {
    async get(): Promise<Settings> {
        return store().read();
    },

    async update(patch: SettingsUpdateInput): Promise<Settings> {
        return store().mutate((current) => ({ ...current, ...stripUndefined(patch) }));
    },
};

const stripUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) out[k] = v;
    }
    return out as Partial<T>;
};
