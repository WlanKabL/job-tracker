import { applicationUpdateSchema } from "@job-tracker/shared";
import { applicationsRepo } from "../../repositories/applications-repo";
import { notFound } from "../../utils/errors";
import { readBodyAs } from "../../utils/validate";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) throw notFound("Application");
    const patch = await readBodyAs(event, applicationUpdateSchema);
    return applicationsRepo.update(id, patch);
});
