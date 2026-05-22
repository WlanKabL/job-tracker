import { settingsRepo } from "../repositories/settings-repo";

export default defineEventHandler(() => settingsRepo.get());
