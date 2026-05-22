import { z } from "zod";
import { applicationsRepo } from "../../../repositories/applications-repo";
import { notFound } from "../../../utils/errors";
import { readBodyAs } from "../../../utils/validate";

const schema = z.object({ archived: z.boolean() });

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) throw notFound("Application");
    const { archived } = await readBodyAs(event, schema);
    return applicationsRepo.setArchived(id, archived);
});
