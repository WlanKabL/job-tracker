import { z } from "zod";
import { APPLICATION_SOURCE, COMPANY_SIZE, type CompanySize, WORK_MODE } from "../enums.js";

/**
 * Schema for the JSON payload that ChatGPT returns after extracting a job posting.
 *
 * Design rules:
 *   - Top-level is `.strict()` — unknown top-level keys = drift, the importer
 *     surfaces them to the user so they can adjust the ChatGPT prompt.
 *   - Strings are trimmed; empty strings become undefined.
 *   - Nested research/notes objects use `.passthrough()` because ChatGPT often
 *     adds extra sub-fields ("companySizeAssessment", new types of "signals") —
 *     we don't want to fail the whole import for those.
 *   - Markdown URL wrapping and `[Klären:]` placeholders are handled
 *     by `preprocessImportPayload` BEFORE validation, not here.
 */
const lenientString = (max = 1000) =>
    z
        .string()
        .trim()
        .max(max)
        .transform((v) => (v === "" ? undefined : v))
        .optional();

const lenientCompanySize = z
    .string()
    .optional()
    .transform((v): CompanySize | undefined => {
        if (!v) return undefined;
        return (COMPANY_SIZE as readonly string[]).includes(v) ? (v as CompanySize) : undefined;
    });

export const importCompanySchema = z
    .object({
        name: z.string().trim().min(1).max(200),
        website: lenientString(500),
        industry: lenientString(200),
        size: lenientCompanySize,
        location: lenientString(200),
    })
    .passthrough();

export const importContactSchema = z
    .object({
        name: z.string().trim().min(1).max(200),
        role: lenientString(200),
        email: lenientString(200),
        phone: lenientString(50),
        linkedinUrl: lenientString(500),
    })
    .passthrough();

/** ChatGPT often returns deep research blocks. We capture them so they don't get lost. */
export const importCompanyResearchSchema = z
    .object({
        summary: lenientString(5000),
        fundingStatus: lenientString(2000),
        companySizeAssessment: lenientString(2000),
        techStackHints: z.array(z.string().trim().min(1)).optional(),
        reviewSignals: z.array(z.string().trim().min(1)).optional(),
        newsSignals: z.array(z.string().trim().min(1)).optional(),
        sources: z.array(z.string().trim().min(1)).optional(),
    })
    .passthrough();

export const importSalaryResearchSchema = z
    .object({
        estimatedRange: lenientString(200),
        advertisedRange: lenientString(200),
        marketComparison: z.array(z.string().trim().min(1)).optional(),
        sources: z.array(z.string().trim().min(1)).optional(),
        note: lenientString(2000),
    })
    .passthrough();

export const importPayloadSchema = z
    .object({
        // Core fields (also written by `extract` prompt baseline)
        company: importCompanySchema,
        position: z.string().trim().min(1).max(200),
        source: z.enum(APPLICATION_SOURCE).optional().default("other"),
        sourceUrl: lenientString(1000),
        location: lenientString(200),
        workMode: z.enum(WORK_MODE).optional(),
        salaryMin: z.number().int().nonnegative().optional(),
        salaryMax: z.number().int().nonnegative().optional(),
        salaryCurrency: lenientString(10),
        salaryPeriod: z.enum(["yearly", "monthly", "hourly", "daily"]).optional(),
        techStack: z.array(z.string().trim().min(1).max(80)).default([]),
        requirements: z.array(z.string().trim().min(1).max(500)).default([]),
        niceToHaves: z.array(z.string().trim().min(1).max(500)).default([]),
        benefits: z.array(z.string().trim().min(1).max(500)).default([]),
        description: lenientString(50000),
        cheatsheet: lenientString(50000),
        rating: z.number().int().min(1).max(5).optional(),
        contacts: z.array(importContactSchema).default([]),

        // Rich research fields ChatGPT generates when web search + memory are on.
        // These get mapped into the existing entities (company / application / openQuestions)
        // by the import endpoint — see `applications/import.post.ts`.
        companyResearch: importCompanyResearchSchema.optional(),
        salaryResearch: importSalaryResearchSchema.optional(),
        fitNotes: z.array(z.string().trim().min(1)).optional(),
        openQuestions: z
            .array(z.union([z.string().trim().min(1), z.object({ question: z.string() }).passthrough()]))
            .optional(),
    })
    .strict();

export type ImportPayload = z.infer<typeof importPayloadSchema>;
export type ImportCompany = z.infer<typeof importCompanySchema>;
export type ImportContact = z.infer<typeof importContactSchema>;
export type ImportCompanyResearch = z.infer<typeof importCompanyResearchSchema>;
export type ImportSalaryResearch = z.infer<typeof importSalaryResearchSchema>;

export const companyResolveSchema = z.object({
    /** Strategy when an existing company with the same normalized name is found. */
    strategy: z.enum(["reuse_existing", "create_new", "ask"]).default("ask"),
    /** When the user confirmed "create_new" or "reuse_existing", this is the chosen companyId. */
    existingCompanyId: z.string().uuid().optional(),
});

export type CompanyResolveInput = z.infer<typeof companyResolveSchema>;

/**
 * Drift report returned by the import endpoint. Tells the user what we silently
 * fixed or remapped so they can adjust the ChatGPT prompt over time.
 */
export interface ImportDriftReport {
    /** Field paths where markdown URL/email wrapping was unwrapped. */
    unwrappedLinks: string[];
    /** Field paths where `[Klären:]` placeholders were stripped. */
    strippedPlaceholders: string[];
    /** Top-level unknown keys that strict schema would have rejected — present only when import was rerun in lenient mode (currently never). */
    unknownTopLevelKeys?: string[];
    /** What we mapped from rich research blocks into existing entities. Human-readable lines. */
    mappings: string[];
}
