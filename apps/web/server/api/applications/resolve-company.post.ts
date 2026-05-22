import { z } from "zod";
import { companiesRepo } from "../../repositories/companies-repo";
import { readBodyAs } from "../../utils/validate";

const schema = z.object({ name: z.string().trim().min(1).max(200) });

export default defineEventHandler(async (event) => {
    const { name } = await readBodyAs(event, schema);
    const match = await companiesRepo.findByNormalizedName(name);
    return { match };
});
