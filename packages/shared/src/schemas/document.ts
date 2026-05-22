import { z } from "zod";
import { DOCUMENT_TYPE } from "../enums.js";
import { isoDateSchema, optionalString, trimmedString, uuidSchema } from "./common.js";

export const documentSchema = z.object({
    id: uuidSchema,
    type: z.enum(DOCUMENT_TYPE),
    name: trimmedString(200),
    filename: optionalString(500),
    url: optionalString(500),
    version: optionalString(50),
    notes: optionalString(2000),
    createdAt: isoDateSchema,
});

export type Document = z.infer<typeof documentSchema>;

export const documentCreateSchema = documentSchema.omit({ id: true, createdAt: true });

export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;

export const documentUpdateSchema = documentCreateSchema.partial();

export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
