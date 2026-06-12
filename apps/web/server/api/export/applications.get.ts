import { tabularExportQuerySchema } from "@job-tracker/shared";
import { applicationsRepo } from "../../repositories/applications-repo";
import { companiesRepo } from "../../repositories/companies-repo";
import { settingsRepo } from "../../repositories/settings-repo";
import { readQueryAs } from "../../utils/validate";
import { buildExportDocument } from "../../utils/export/rows";
import { renderCsv } from "../../utils/export/csv";
import { renderXlsx } from "../../utils/export/xlsx";
import { renderPdf } from "../../utils/export/pdf";

const CONTENT_TYPES = {
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv; charset=utf-8",
    pdf: "application/pdf",
} as const;

export default defineEventHandler(async (event) => {
    const query = readQueryAs(event, tabularExportQuerySchema);
    // Archived rows are intentionally included here; archived filtering is
    // preset-dependent and lives in the row builder.
    const [applications, companies, settings] = await Promise.all([
        applicationsRepo.list({ includeArchived: true }),
        companiesRepo.list(),
        settingsRepo.get(),
    ]);

    const doc = buildExportDocument({
        preset: query.preset,
        applications,
        companies,
        settings,
        from: query.from,
        to: query.to,
        includeArchived: query.includeArchived,
        exportedAt: new Date(),
    });

    const buffer =
        query.format === "xlsx"
            ? await renderXlsx(doc)
            : query.format === "csv"
              ? renderCsv(doc)
              : await renderPdf(doc);

    await settingsRepo.update({ lastExportAt: new Date().toISOString() });

    setResponseHeader(event, "Content-Type", CONTENT_TYPES[query.format]);
    setResponseHeader(
        event,
        "Content-Disposition",
        `attachment; filename="${doc.filename}.${query.format}"`,
    );
    return buffer;
});
