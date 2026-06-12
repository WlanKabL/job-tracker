import { applicationsRepo } from "../repositories/applications-repo";
import { companiesRepo } from "../repositories/companies-repo";
import { settingsRepo } from "../repositories/settings-repo";

export default defineEventHandler(async (event) => {
    const [applications, companies, settings] = await Promise.all([
        applicationsRepo.list({ includeArchived: true }),
        companiesRepo.list(),
        settingsRepo.get(),
    ]);
    const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        companies,
        applications,
        settings,
    };
    await settingsRepo.update({ lastExportAt: payload.exportedAt });
    const filename = `job-tracker-export-${payload.exportedAt.slice(0, 10)}.json`;
    setResponseHeader(event, "Content-Type", "application/json; charset=utf-8");
    setResponseHeader(event, "Content-Disposition", `attachment; filename="${filename}"`);
    return payload;
});
