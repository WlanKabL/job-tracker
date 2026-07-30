import type { Settings, SettingsUpdateInput } from "@job-tracker/shared";
import { settingsSchema } from "@job-tracker/shared";
import { dataFile } from "../utils/paths";
import { getStore } from "../utils/json-store";
import { mergePatch } from "../utils/patch";

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
        const next = await store().mutate((current) =>
            mergePatch(withDefaults(current), patch),
        );
        return withDefaults(next);
    },
};
