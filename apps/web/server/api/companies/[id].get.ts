import { applicationsRepo } from "../../repositories/applications-repo";
import { companiesRepo } from "../../repositories/companies-repo";
import { notFound } from "../../utils/errors";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) throw notFound("Company");

    const company = await companiesRepo.findById(id);
    if (!company) throw notFound("Company");

    const applications = await applicationsRepo.list({
        companyId: id,
        includeArchived: true,
    });

    return { ...company, applications };
});
