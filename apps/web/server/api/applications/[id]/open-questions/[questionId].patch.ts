import { openQuestionUpdateSchema } from "@job-tracker/shared";
import { applicationsRepo } from "../../../../repositories/applications-repo";
import { notFound } from "../../../../utils/errors";
import { readBodyAs } from "../../../../utils/validate";

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const questionId = getRouterParam(event, "questionId");
    if (!id || !questionId) throw notFound("Open question");
    const patch = await readBodyAs(event, openQuestionUpdateSchema);
    return applicationsRepo.updateOpenQuestion(id, questionId, patch);
});
