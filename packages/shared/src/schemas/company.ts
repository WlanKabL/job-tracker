import { z } from "zod";
import { COMPANY_SIZE } from "../enums.js";
import { isoDateSchema, optionalString, trimmedString, uuidSchema } from "./common.js";

export const companySchema = z.object({
    id: uuidSchema,
    name: trimmedString(200),
    website: optionalString(500),
    industry: optionalString(200),
    size: z.enum(COMPANY_SIZE).optional(),
    location: optionalString(200),
    notes: optionalString(5000),
    cheatsheet: optionalString(20000),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
});

export type Company = z.infer<typeof companySchema>;

export const companyCreateSchema = companySchema
    .omit({ id: true, createdAt: true, updatedAt: true })
    .extend({ name: trimmedString(200) });

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;

export const companyUpdateSchema = companyCreateSchema.partial();

export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
