import { applicationsRepo } from "../../repositories/applications-repo";
import { companiesRepo } from "../../repositories/companies-repo";
import { notFound } from "../../utils/errors";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) throw notFound("Application");

    const application = await applicationsRepo.findById(id);
    if (!application) throw notFound("Application");

    const company = await companiesRepo.findById(application.companyId);
    return { ...application, company };
});
