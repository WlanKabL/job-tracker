import { randomUUID } from "node:crypto";
import type {
    Company,
    CompanyCreateInput,
    CompanyUpdateInput,
} from "@job-tracker/shared";
import { dataFile } from "../utils/paths";
import { getStore } from "../utils/json-store";
import { normalizeCompanyName } from "../utils/normalize";
import { mergePatch } from "../utils/patch";

interface CompaniesFile {
    version: 1;
    companies: Company[];
}

const defaultFile: CompaniesFile = { version: 1, companies: [] };

const store = () => getStore<CompaniesFile>(dataFile("companies.json"), defaultFile);

const now = () => new Date().toISOString();

export const companiesRepo = {
    async list(): Promise<Company[]> {
        const data = await store().read();
        return [...data.companies].sort((a, b) => a.name.localeCompare(b.name, "de"));
    },

    async findById(id: string): Promise<Company | null> {
        const data = await store().read();
        return data.companies.find((c) => c.id === id) ?? null;
    },

    async findByNormalizedName(name: string): Promise<Company | null> {
        const target = normalizeCompanyName(name);
        const data = await store().read();
        return data.companies.find((c) => normalizeCompanyName(c.name) === target) ?? null;
    },

    async create(input: CompanyCreateInput): Promise<Company> {
        const company: Company = {
            id: randomUUID(),
            createdAt: now(),
            updatedAt: now(),
            name: input.name,
            website: input.website,
            industry: input.industry,
            size: input.size,
            location: input.location,
            notes: input.notes,
            cheatsheet: input.cheatsheet,
        };
        await store().mutate((current) => ({
            ...current,
            companies: [...current.companies, company],
        }));
        return company;
    },

    async update(id: string, patch: CompanyUpdateInput): Promise<Company | null> {
        let updated: Company | null = null;
        await store().mutate((current) => {
            const idx = current.companies.findIndex((c) => c.id === id);
            if (idx === -1) return current;
            const merged: Company = {
                ...mergePatch(current.companies[idx]!, patch),
                updatedAt: now(),
            };
            const next = [...current.companies];
            next[idx] = merged;
            updated = merged;
            return { ...current, companies: next };
        });
        return updated;
    },

    async delete(id: string): Promise<boolean> {
        let deleted = false;
        await store().mutate((current) => {
            const before = current.companies.length;
            const next = current.companies.filter((c) => c.id !== id);
            deleted = next.length < before;
            return { ...current, companies: next };
        });
        return deleted;
    },
};
