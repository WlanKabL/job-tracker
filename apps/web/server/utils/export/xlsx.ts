import ExcelJS from "exceljs";
import type { ApplicationStatus } from "@job-tracker/shared";
import type { ExportDocumentModel } from "./rows";

/** ARGB pairs (soft fill, strong text) aligned with the UI status badge palette. */
const STATUS_COLORS: Record<ApplicationStatus, { fill: string; font: string }> = {
    saved: { fill: "FFF3F4F6", font: "FF6B7280" },
    applied: { fill: "FFE2E8F0", font: "FF334155" },
    phone: { fill: "FFE0F2FE", font: "FF075985" },
    interview: { fill: "FFDBEAFE", font: "FF1E40AF" },
    offer: { fill: "FFD1FAE5", font: "FF065F46" },
    rejected: { fill: "FFFEE2E2", font: "FF991B1B" },
    withdrawn: { fill: "FFFFEDD5", font: "FF9A3412" },
    ghosted: { fill: "FFE5E7EB", font: "FF374151" },
};

export const renderXlsx = async (doc: ExportDocumentModel): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Export");
    const colCount = doc.columns.length;

    const addMetaRow = (text: string, opts?: { bold?: boolean; size?: number }) => {
        const row = sheet.addRow([text]);
        sheet.mergeCells(row.number, 1, row.number, colCount);
        row.getCell(1).font = { bold: opts?.bold ?? false, size: opts?.size ?? 11 };
    };

    addMetaRow(doc.title, { bold: true, size: 14 });
    if (doc.applicantLine) addMetaRow(doc.applicantLine);
    const metaParts = [doc.exportedAtLabel, doc.rangeLabel, doc.countLabel].filter(
        (s): s is string => typeof s === "string" && s.length > 0,
    );
    addMetaRow(metaParts.join("   ·   "));
    sheet.addRow([]);

    const headerRow = sheet.addRow(doc.columns.map((c) => c.header));
    headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });

    for (const row of doc.rows) {
        const added = sheet.addRow(row.map((cell) => cell.value));
        row.forEach((cell, idx) => {
            if (!cell.status) return;
            const colors = STATUS_COLORS[cell.status];
            const target = added.getCell(idx + 1);
            target.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.fill } };
            target.font = { color: { argb: colors.font } };
        });
    }

    if (doc.emptyNotice) {
        const row = sheet.addRow([doc.emptyNotice]);
        sheet.mergeCells(row.number, 1, row.number, colCount);
        row.getCell(1).font = { italic: true };
    }

    doc.columns.forEach((col, idx) => {
        sheet.getColumn(idx + 1).width = col.width;
    });
    sheet.views = [{ state: "frozen", ySplit: headerRow.number }];
    sheet.autoFilter = {
        from: { row: headerRow.number, column: 1 },
        to: { row: headerRow.number + Math.max(doc.rows.length, 1), column: colCount },
    };

    const out = await workbook.xlsx.writeBuffer();
    return Buffer.from(new Uint8Array(out));
};
