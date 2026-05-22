import { z } from "zod";

export const isoDateSchema = z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid ISO date string" });

export const uuidSchema = z.string().uuid();

export const urlSchema = z.string().url();

export const optionalUrlSchema = z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.string().url().optional())
    .or(z.literal("").transform(() => undefined))
    .or(z.undefined());

export const trimmedString = (max = 500) =>
    z.string().trim().min(1, "Required").max(max, `Max ${max} characters`);

export const optionalString = (max = 500) =>
    z
        .string()
        .trim()
        .max(max, `Max ${max} characters`)
        .transform((v) => (v === "" ? undefined : v))
        .optional();
