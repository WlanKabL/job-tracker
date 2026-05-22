import { applicationsRepo } from "../../../../repositories/applications-repo";
import { notFound } from "../../../../utils/errors";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const questionId = getRouterParam(event, "questionId");
    if (!id || !questionId) throw notFound("Open question");
    return applicationsRepo.deleteOpenQuestion(id, questionId);
});
