import { documentUpdateSchema } from "@job-tracker/shared";
import { applicationsRepo } from "../../../../repositories/applications-repo";
import { notFound } from "../../../../utils/errors";
import { readBodyAs } from "../../../../utils/validate";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const documentId = getRouterParam(event, "documentId");
    if (!id || !documentId) throw notFound("Document");
    const patch = await readBodyAs(event, documentUpdateSchema);
    return applicationsRepo.updateDocument(id, documentId, patch);
});
