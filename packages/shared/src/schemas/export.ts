import { z } from "zod";
import { isoDateSchema } from "./common.js";

export const EXPORT_FORMAT = ["xlsx", "csv", "pdf"] as const;

export type ExportFormat = (typeof EXPORT_FORMAT)[number];

export const EXPORT_PRESET = ["afa", "full"] as const;

export type ExportPreset = (typeof EXPORT_PRESET)[number];

export const tabularExportQuerySchema = z
    .object({
        format: z.enum(EXPORT_FORMAT),
        preset: z.enum(EXPORT_PRESET),
        from: isoDateSchema.optional(),
        to: isoDateSchema.optional(),
        includeArchived: z
            .union([z.string(), z.boolean()])
            .optional()
            .transform((v) => v === true || v === "true" || v === "1"),
    })
    .refine((q) => !q.from || !q.to || Date.parse(q.from) <= Date.parse(q.to), {
        message: "from must not be after to",
        path: ["from"],
    });

export type TabularExportQuery = z.infer<typeof tabularExportQuerySchema>;
