import { companyCreateSchema } from "@job-tracker/shared";
import { companiesRepo } from "../../repositories/companies-repo";
import { readBodyAs } from "../../utils/validate";

export default defineEventHandler(async (event) => {
    const input = await readBodyAs(event, companyCreateSchema);
    return companiesRepo.create(input);
});
