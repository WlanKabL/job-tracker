import { applicationsRepo } from "../../../../repositories/applications-repo";
import { notFound } from "../../../../utils/errors";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const documentId = getRouterParam(event, "documentId");
    if (!id || !documentId) throw notFound("Document");
    return applicationsRepo.deleteDocument(id, documentId);
});
