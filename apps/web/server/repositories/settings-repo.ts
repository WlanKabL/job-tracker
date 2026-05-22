import type { Settings, SettingsUpdateInput } from "@job-tracker/shared";
import { settingsSchema } from "@job-tracker/shared";
import { dataFile } from "../utils/paths";
import { getStore } from "../utils/json-store";

const defaultSettings: Settings = settingsSchema.parse({});

const store = () => getStore<Settings>(dataFile("settings.json"), defaultSettings);

/**
 * Re-parse through the schema so any keys missing from an older settings.json get
 * their defaults applied (Zod fills them in at parse-time).
 */
const withDefaults = (raw: Settings): Settings => settingsSchema.parse(raw);

export const settingsRepo = {
    async get(): Promise<Settings> {
        const raw = await store().read();
        return withDefaults(raw);
    },

    async update(patch: SettingsUpdateInput): Promise<Settings> {
        const next = await store().mutate((current) => ({
            ...withDefaults(current),
            ...stripUndefined(patch),
        }));
        return withDefaults(next);
    },
};

const stripUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) out[k] = v;
    }
    return out as Partial<T>;
};
