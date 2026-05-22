import { z } from "zod";
import { APPLICATION_SOURCE, APPLICATION_STATUS } from "@job-tracker/shared";
import { applicationsRepo } from "../../repositories/applications-repo";
import { companiesRepo } from "../../repositories/companies-repo";
import { readQueryAs } from "../../utils/validate";

const querySchema = z.object({
    status: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((v) => {
            if (!v) return undefined;
            const list = Array.isArray(v) ? v : v.split(",");
            const valid = list.filter((s) =>
                (APPLICATION_STATUS as readonly string[]).includes(s),
            ) as (typeof APPLICATION_STATUS)[number][];
            return valid.length > 0 ? valid : undefined;
        }),
    source: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((v) => {
            if (!v) return undefined;
            const list = Array.isArray(v) ? v : v.split(",");
            const valid = list.filter((s) =>
                (APPLICATION_SOURCE as readonly string[]).includes(s),
            ) as (typeof APPLICATION_SOURCE)[number][];
            return valid.length > 0 ? valid : undefined;
        }),
    search: z.string().optional(),
    includeArchived: z
        .union([z.string(), z.boolean()])
        .optional()
        .transform((v) => v === true || v === "true" || v === "1"),
    companyId: z.string().uuid().optional(),
    embed: z
        .union([z.string(), z.boolean()])
        .optional()
        .transform((v) => v === true || v === "true" || v === "1"),
});

export default defineEventHandler(async (event) => {
    const filters = readQueryAs(event, querySchema);
    const applications = await applicationsRepo.list(filters);
    if (!filters.embed) return applications;

    const companies = await companiesRepo.list();
    const companyById = new Map(companies.map((c) => [c.id, c]));
    return applications.map((a) => ({
        ...a,
        company: companyById.get(a.companyId) ?? null,
    }));
});
