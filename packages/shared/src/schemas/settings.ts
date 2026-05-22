import { z } from "zod";
import { isoDateSchema } from "./common.js";

export const settingsSchema = z.object({
    theme: z.enum(["dark", "light"]).default("dark"),
    defaultView: z.enum(["list", "kanban"]).default("kanban"),
    followUpDays: z.number().int().min(1).max(60).default(7),
    weeklyGoal: z.number().int().min(0).max(200).default(15),
    lastExportAt: isoDateSchema.optional(),
    lastBackupAt: isoDateSchema.optional(),
});

export type Settings = z.infer<typeof settingsSchema>;

export const settingsUpdateSchema = settingsSchema.partial();

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
