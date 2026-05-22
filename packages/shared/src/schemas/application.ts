import { z } from "zod";
import { APPLICATION_SOURCE, APPLICATION_STATUS, WORK_MODE } from "../enums.js";
import { isoDateSchema, optionalString, trimmedString, uuidSchema } from "./common.js";
import { contactSchema } from "./contact.js";
import { documentSchema } from "./document.js";
import { openQuestionSchema } from "./open-question.js";
import { timelineEntrySchema } from "./timeline.js";

export const salarySchema = z.object({
    min: z.number().int().nonnegative().optional(),
    max: z.number().int().nonnegative().optional(),
    currency: z.string().trim().min(1).max(10).default("EUR"),
    period: z.enum(["yearly", "monthly", "hourly", "daily"]).default("yearly"),
});

export type Salary = z.infer<typeof salarySchema>;

export const applicationSchema = z.object({
    id: uuidSchema,
    companyId: uuidSchema,
    position: trimmedString(200),
    source: z.enum(APPLICATION_SOURCE),
    sourceUrl: optionalString(1000),
    status: z.enum(APPLICATION_STATUS),
    appliedAt: isoDateSchema.optional(),
    nextFollowUpAt: isoDateSchema.optional(),
    location: optionalString(200),
    workMode: z.enum(WORK_MODE).optional(),
    salary: salarySchema.optional(),
    techStack: z.array(z.string().trim().min(1).max(80)).default([]),
    requirements: z.array(z.string().trim().min(1).max(500)).default([]),
    niceToHaves: z.array(z.string().trim().min(1).max(500)).default([]),
    benefits: z.array(z.string().trim().min(1).max(500)).default([]),
    description: optionalString(50000),
    cheatsheet: optionalString(50000),
    notes: optionalString(20000),
    rating: z.number().int().min(1).max(5).optional(),
    contacts: z.array(contactSchema).default([]),
    timeline: z.array(timelineEntrySchema).default([]),
    documents: z.array(documentSchema).default([]),
    openQuestions: z.array(openQuestionSchema).default([]),
    archived: z.boolean().default(false),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
});

export type Application = z.infer<typeof applicationSchema>;

/** Payload for the "manual create" form / API. companyId required. */
export const applicationCreateSchema = applicationSchema
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        contacts: true,
        timeline: true,
        documents: true,
        openQuestions: true,
        archived: true,
    })
    .extend({
        position: trimmedString(200),
        source: z.enum(APPLICATION_SOURCE),
        status: z.enum(APPLICATION_STATUS).default("saved"),
        contacts: z.array(contactSchema.omit({ id: true, createdAt: true })).default([]),
    });

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;

export const applicationUpdateSchema = applicationSchema
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        contacts: true,
        timeline: true,
        documents: true,
        openQuestions: true,
    })
    .partial();

export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;

export const statusChangeSchema = z.object({
    toStatus: z.enum(APPLICATION_STATUS),
    note: optionalString(2000),
    occurredAt: isoDateSchema.optional(),
});

export type StatusChangeInput = z.infer<typeof statusChangeSchema>;
