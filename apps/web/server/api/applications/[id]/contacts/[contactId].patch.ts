import { contactUpdateSchema } from "@job-tracker/shared";
import { applicationsRepo } from "../../../../repositories/applications-repo";
import { notFound } from "../../../../utils/errors";
import { readBodyAs } from "../../../../utils/validate";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const contactId = getRouterParam(event, "contactId");
    if (!id || !contactId) throw notFound("Contact");
    const patch = await readBodyAs(event, contactUpdateSchema);
    return applicationsRepo.updateContact(id, contactId, patch);
});
