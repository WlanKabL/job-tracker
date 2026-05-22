import { settingsUpdateSchema } from "@job-tracker/shared";
import { settingsRepo } from "../repositories/settings-repo";
import { readBodyAs } from "../utils/validate";

export default defineEventHandler(async (event) => {
    const patch = await readBodyAs(event, settingsUpdateSchema);
    return settingsRepo.update(patch);
});
