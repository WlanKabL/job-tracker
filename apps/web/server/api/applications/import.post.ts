import { z } from "zod";
import type {
    Application,
    ApplicationCreateInput,
    Company,
    ImportCompanyResearch,
    ImportDriftReport,
    ImportPayload,
    ImportSalaryResearch,
    OpenQuestionCreateInput,
} from "@job-tracker/shared";
import {
    companyResolveSchema,
    importPayloadSchema,
    parseSalaryRange,
    preprocessImportPayload,
} from "@job-tracker/shared";
import { applicationsRepo } from "../../repositories/applications-repo";
import { companiesRepo } from "../../repositories/companies-repo";
import { badRequest, conflict, invalidPayload } from "../../utils/errors";

const bodySchema = z.object({
    payload: z.unknown(),
    resolve: companyResolveSchema.optional(),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const wrap = bodySchema.safeParse(body);
    if (!wrap.success) throw invalidPayload(wrap.error);
    const resolve = wrap.data.resolve ?? { strategy: "ask" };

    const { value: preprocessed, report: pre } = preprocessImportPayload(wrap.data.payload);

    const parsed = importPayloadSchema.safeParse(preprocessed);
    if (!parsed.success) {
        const unrecognized: string[] = [];
        const other: typeof parsed.error.issues = [];
        for (const issue of parsed.error.issues) {
            if (issue.code === "unrecognized_keys") {
                unrecognized.push(...((issue as { keys?: string[] }).keys ?? []));
            } else {
                other.push(issue);
            }
        }
        if (unrecognized.length > 0 && other.length === 0) {
            throw badRequest("ChatGPT lieferte unbekannte Felder", {
                reason: "unexpected_fields",
                unexpectedFields: unrecognized,
                hint: "Diese Top-Level-Felder sind nicht im Schema. Entweder Extract-Prompt anpassen, oder die Felder vor dem Import aus dem JSON entfernen.",
            });
        }
        throw invalidPayload(parsed.error);
    }
    const payload = parsed.data;

    const mappings: string[] = [];

    let reusedCompany = false;
    if (resolve.existingCompanyId) reusedCompany = true;
    else if (resolve.strategy === "reuse_existing") {
        const existing = await companiesRepo.findByNormalizedName(payload.company.name);
        if (existing) reusedCompany = true;
    } else if (resolve.strategy === "ask") {
        const existing = await companiesRepo.findByNormalizedName(payload.company.name);
        if (existing) reusedCompany = true;
    }

    const company = await resolveCompany(payload.company, resolve, payload.companyResearch, mappings);

    let application: Application = await applicationsRepo.create(
        buildApplicationInput(company.id, payload, mappings),
    );

    application = await persistOpenQuestions(application.id, payload.openQuestions, mappings);

    const drift: ImportDriftReport = {
        unwrappedLinks: pre.unwrappedLinks,
        strippedPlaceholders: pre.strippedPlaceholders,
        mappings,
    };
    if (pre.unwrappedQuestionMarkers.length > 0) {
        drift.mappings.unshift(
            `${pre.unwrappedQuestionMarkers.length} offene Frage(n) aus [Klären:]-Wrappern extrahiert.`,
        );
    }

    return { application, company, reusedExistingCompany: reusedCompany, drift };
});

const persistOpenQuestions = async (
    appId: string,
    questions: ImportPayload["openQuestions"] | undefined,
    mappings: string[],
): Promise<Application> => {
    if (!questions || questions.length === 0) {
        return (await applicationsRepo.findById(appId))!;
    }
    let latest: Application | null = null;
    let added = 0;
    for (const q of questions) {
        const text = typeof q === "string" ? q : (q.question ?? "");
        if (!text.trim()) continue;
        const input: OpenQuestionCreateInput = { question: text.trim() };
        latest = await applicationsRepo.addOpenQuestion(appId, input);
        added++;
    }
    if (added > 0) {
        mappings.push(`${added} offene Frage(n) aus openQuestions als strukturierte Einträge angelegt.`);
    }
    return latest ?? (await applicationsRepo.findById(appId))!;
};

const buildApplicationInput = (
    companyId: string,
    payload: ImportPayload,
    mappings: string[],
): ApplicationCreateInput => {
    let salary: ApplicationCreateInput["salary"] = undefined;
    if (payload.salaryMin !== undefined || payload.salaryMax !== undefined) {
        salary = {
            min: payload.salaryMin,
            max: payload.salaryMax,
            currency: payload.salaryCurrency ?? "EUR",
            period: payload.salaryPeriod ?? "yearly",
        };
    } else if (payload.salaryResearch?.estimatedRange) {
        const parsed = parseSalaryRange(payload.salaryResearch.estimatedRange);
        if (parsed) {
            salary = parsed;
            mappings.push(
                `Gehalts-Range aus salaryResearch.estimatedRange übernommen: ${parsed.min}–${parsed.max} ${parsed.currency}/${parsed.period}.`,
            );
        }
    }

    const notesParts: string[] = [];
    if (payload.fitNotes && payload.fitNotes.length > 0) {
        notesParts.push("## Fit-Notes (ChatGPT)\n" + payload.fitNotes.map((n) => `- ${n}`).join("\n"));
        mappings.push(`${payload.fitNotes.length} fitNotes in application.notes übernommen.`);
    }
    if (payload.salaryResearch) {
        const block = formatSalaryResearch(payload.salaryResearch);
        if (block) {
            notesParts.push(block);
            mappings.push("salaryResearch in application.notes übernommen.");
        }
    }
    const notes = notesParts.length > 0 ? notesParts.join("\n\n") : undefined;

    return {
        companyId,
        position: payload.position,
        source: payload.source ?? "other",
        sourceUrl: payload.sourceUrl,
        status: "saved",
        location: payload.location,
        workMode: payload.workMode,
        salary,
        techStack: payload.techStack ?? [],
        requirements: payload.requirements ?? [],
        niceToHaves: payload.niceToHaves ?? [],
        benefits: payload.benefits ?? [],
        description: payload.description,
        cheatsheet: payload.cheatsheet,
        notes,
        rating: payload.rating,
        contacts: (payload.contacts ?? []).map((c) => ({
            name: c.name,
            role: c.role,
            email: c.email,
            phone: c.phone,
            linkedinUrl: c.linkedinUrl,
        })),
    };
};

const formatCompanyResearch = (r: ImportCompanyResearch): string | null => {
    const blocks: string[] = [];
    if (r.summary) blocks.push(`## Profil\n${r.summary}`);
    if (r.fundingStatus) blocks.push(`## Funding\n${r.fundingStatus}`);
    if (r.companySizeAssessment) blocks.push(`## Größe\n${r.companySizeAssessment}`);
    if (r.techStackHints && r.techStackHints.length > 0) {
        blocks.push(`## Tech-Stack-Hinweise\n${r.techStackHints.map((t) => `- ${t}`).join("\n")}`);
    }
    if (r.reviewSignals && r.reviewSignals.length > 0) {
        blocks.push(`## Reviews\n${r.reviewSignals.map((s) => `- ${s}`).join("\n")}`);
    }
    if (r.newsSignals && r.newsSignals.length > 0) {
        blocks.push(`## News\n${r.newsSignals.map((s) => `- ${s}`).join("\n")}`);
    }
    if (r.sources && r.sources.length > 0) {
        blocks.push(`## Quellen\n${r.sources.map((s) => `- ${s}`).join("\n")}`);
    }
    if (blocks.length === 0) return null;
    return blocks.join("\n\n");
};

const formatSalaryResearch = (r: ImportSalaryResearch): string | null => {
    const blocks: string[] = [];
    if (r.estimatedRange) blocks.push(`**Geschätzte Range:** ${r.estimatedRange}`);
    if (r.advertisedRange) blocks.push(`**Anzeige nennt:** ${r.advertisedRange}`);
    if (r.marketComparison && r.marketComparison.length > 0) {
        blocks.push(r.marketComparison.map((s) => `- ${s}`).join("\n"));
    }
    if (r.sources && r.sources.length > 0) {
        blocks.push(`**Quellen:**\n${r.sources.map((s) => `- ${s}`).join("\n")}`);
    }
    if (r.note) blocks.push(`> ${r.note}`);
    if (blocks.length === 0) return null;
    return `## Gehalts-Recherche (ChatGPT)\n${blocks.join("\n\n")}`;
};

const resolveCompany = async (
    payloadCompany: ImportPayload["company"],
    resolve: { strategy: string; existingCompanyId?: string },
    research: ImportCompanyResearch | undefined,
    mappings: string[],
): Promise<Company> => {
    if (resolve.existingCompanyId) {
        const existing = await companiesRepo.findById(resolve.existingCompanyId);
        if (!existing) throw conflict("Selected company no longer exists");
        return existing;
    }

    if (resolve.strategy === "create_new") {
        return createCompanyFromPayload(payloadCompany, research, mappings);
    }

    const existing = await companiesRepo.findByNormalizedName(payloadCompany.name);
    if (existing && resolve.strategy === "reuse_existing") return existing;
    if (existing) {
        throw conflict("Company name already exists", {
            existingCompany: existing,
            incomingCompany: payloadCompany,
            reason: "company_name_conflict",
        });
    }

    return createCompanyFromPayload(payloadCompany, research, mappings);
};

const createCompanyFromPayload = (
    payloadCompany: ImportPayload["company"],
    research: ImportCompanyResearch | undefined,
    mappings: string[],
): Promise<Company> => {
    const cheatsheet = research ? formatCompanyResearch(research) : null;
    if (cheatsheet) {
        mappings.push("companyResearch in company.cheatsheet übernommen (neue Firma).");
    }
    return companiesRepo.create({
        name: payloadCompany.name,
        website: payloadCompany.website,
        industry: payloadCompany.industry,
        size: payloadCompany.size as Company["size"],
        location: payloadCompany.location,
        cheatsheet: cheatsheet ?? undefined,
    });
};
