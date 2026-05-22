import { companiesRepo } from "../../repositories/companies-repo";
import { applicationsRepo } from "../../repositories/applications-repo";

export default defineEventHandler(async () => {
    const [companies, applications] = await Promise.all([
        companiesRepo.list(),
        applicationsRepo.list({ includeArchived: true }),
    ]);

    const countsById = new Map<string, number>();
    for (const app of applications) {
        countsById.set(app.companyId, (countsById.get(app.companyId) ?? 0) + 1);
    }

    return companies.map((company) => ({
        ...company,
        applicationCount: countsById.get(company.id) ?? 0,
    }));
});
