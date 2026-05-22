import { applicationsRepo } from "../../../../repositories/applications-repo";
import { notFound } from "../../../../utils/errors";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const contactId = getRouterParam(event, "contactId");
    if (!id || !contactId) throw notFound("Contact");
    return applicationsRepo.deleteContact(id, contactId);
});
