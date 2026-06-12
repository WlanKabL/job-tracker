import { z } from "zod";
import { isoDateSchema } from "./common.js";

export const settingsSchema = z.object({
    theme: z.enum(["dark", "light"]).default("dark"),
    defaultView: z.enum(["list", "kanban"]).default("kanban"),
    followUpDays: z.number().int().min(1).max(60).default(7),
    /** Bewerbungen pro Tag (Default 15). */
    dailyGoal: z.number().int().min(0).max(50).default(15),
    /** Bewerbungen pro Woche (Default 7 × dailyGoal = 105 — kann individuell überschrieben werden). */
    weeklyGoal: z.number().int().min(0).max(500).default(105),
    /** Applicant identity rendered in export document headers. Empty string = not set. */
    applicantName: z.string().trim().max(200).default(""),
    baCustomerNumber: z.string().trim().max(50).default(""),
    lastExportAt: isoDateSchema.optional(),
    lastBackupAt: isoDateSchema.optional(),
});

export type Settings = z.infer<typeof settingsSchema>;

export const settingsUpdateSchema = settingsSchema.partial();

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
