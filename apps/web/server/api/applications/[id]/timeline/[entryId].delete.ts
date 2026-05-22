import { applicationsRepo } from "../../../../repositories/applications-repo";
import { notFound } from "../../../../utils/errors";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const entryId = getRouterParam(event, "entryId");
    if (!id || !entryId) throw notFound("Timeline entry");
    return applicationsRepo.deleteTimelineEntry(id, entryId);
});
