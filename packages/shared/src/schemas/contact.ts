import { z } from "zod";
import { isoDateSchema, optionalString, trimmedString, uuidSchema } from "./common.js";

export const contactSchema = z.object({
    id: uuidSchema,
    name: trimmedString(200),
    role: optionalString(200),
    email: z
        .string()
        .trim()
        .email("Invalid email")
        .optional()
        .or(z.literal("").transform(() => undefined)),
    phone: optionalString(50),
    linkedinUrl: optionalString(500),
    notes: optionalString(2000),
    createdAt: isoDateSchema,
});

export type Contact = z.infer<typeof contactSchema>;

export const contactCreateSchema = contactSchema.omit({ id: true, createdAt: true });

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;

export const contactUpdateSchema = contactCreateSchema.partial();

export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
