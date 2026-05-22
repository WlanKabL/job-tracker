import { applicationCreateSchema } from "@job-tracker/shared";
import { applicationsRepo } from "../../repositories/applications-repo";
import { companiesRepo } from "../../repositories/companies-repo";
import { notFound } from "../../utils/errors";
import { readBodyAs } from "../../utils/validate";

export default defineEventHandler(async (event) => {
    const input = await readBodyAs(event, applicationCreateSchema);
    const company = await companiesRepo.findById(input.companyId);
    if (!company) throw notFound("Company");
    return applicationsRepo.create(input);
});
