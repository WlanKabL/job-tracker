import { companyUpdateSchema } from "@job-tracker/shared";
import { companiesRepo } from "../../repositories/companies-repo";
import { notFound } from "../../utils/errors";
import { readBodyAs } from "../../utils/validate";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) throw notFound("Company");

    const patch = await readBodyAs(event, companyUpdateSchema);
    const updated = await companiesRepo.update(id, patch);
    if (!updated) throw notFound("Company");
    return updated;
});
