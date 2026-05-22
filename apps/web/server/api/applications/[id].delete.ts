import { applicationsRepo } from "../../repositories/applications-repo";
import { notFound } from "../../utils/errors";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) throw notFound("Application");
    const deleted = await applicationsRepo.delete(id);
    if (!deleted) throw notFound("Application");
    return { id, deleted: true };
});
