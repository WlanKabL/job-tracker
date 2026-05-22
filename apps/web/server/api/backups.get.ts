import { listBackups } from "../utils/backup";
import { dataDir } from "../utils/paths";

export default defineEventHandler(async () => {
    const dates = await listBackups(dataDir());
    return { dates };
});
