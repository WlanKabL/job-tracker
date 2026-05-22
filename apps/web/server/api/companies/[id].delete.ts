import { applicationsRepo } from "../../repositories/applications-repo";
import { companiesRepo } from "../../repositories/companies-repo";
import { conflict, notFound } from "../../utils/errors";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) throw notFound("Company");

    const linkedCount = await applicationsRepo.countByCompanyId(id);
    if (linkedCount > 0) {
        throw conflict("Company has linked applications", { linkedCount });
    }

    const deleted = await companiesRepo.delete(id);
    if (!deleted) throw notFound("Company");
    return { id, deleted: true };
});
