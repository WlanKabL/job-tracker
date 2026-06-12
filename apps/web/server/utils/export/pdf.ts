import { createPdf, setFonts } from "pdfmake";
import type { Content, TDocumentDefinitions, TableCell } from "pdfmake/interfaces";
import type { ApplicationStatus } from "@job-tracker/shared";
import type { ExportDocumentModel } from "./rows";

/**
 * PDF standard-14 fonts: built into every PDF viewer, no font files to bundle,
 * WinAnsi encoding covers German umlauts. Avoids Nitro asset issues with
 * pdfmake's embedded Roboto entirely.
 */
setFonts({
    Helvetica: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
    },
});

const STATUS_COLORS: Record<ApplicationStatus, { fill: string; text: string }> = {
    saved: { fill: "#F3F4F6", text: "#6B7280" },
    applied: { fill: "#E2E8F0", text: "#334155" },
    phone: { fill: "#E0F2FE", text: "#075985" },
    interview: { fill: "#DBEAFE", text: "#1E40AF" },
    offer: { fill: "#D1FAE5", text: "#065F46" },
    rejected: { fill: "#FEE2E2", text: "#991B1B" },
    withdrawn: { fill: "#FFEDD5", text: "#9A3412" },
    ghosted: { fill: "#E5E7EB", text: "#374151" },
};

export const renderPdf = async (doc: ExportDocumentModel): Promise<Buffer> => {
    const headerCells: TableCell[] = doc.columns.map((c) => ({
        text: c.header,
        bold: true,
        color: "#FFFFFF",
        fillColor: "#1F2937",
    }));

    const bodyRows: TableCell[][] = doc.rows.map((row) =>
        row.map((cell) => {
            if (!cell.status) return { text: cell.value };
            const colors = STATUS_COLORS[cell.status];
            return { text: cell.value, fillColor: colors.fill, color: colors.text, bold: true };
        }),
    );

    if (bodyRows.length === 0 && doc.emptyNotice) {
        bodyRows.push([
            { text: doc.emptyNotice, italics: true, colSpan: doc.columns.length },
            ...Array.from({ length: doc.columns.length - 1 }, (): TableCell => ({ text: "" })),
        ]);
    }

    const metaParts = [doc.exportedAtLabel, doc.rangeLabel, doc.countLabel].filter(
        (s): s is string => typeof s === "string" && s.length > 0,
    );

    const content: Content[] = [
        { text: doc.title, fontSize: 16, bold: true, margin: [0, 0, 0, 2] },
    ];
    if (doc.applicantLine) {
        content.push({ text: doc.applicantLine, fontSize: 10, margin: [0, 0, 0, 2] });
    }
    content.push({
        text: metaParts.join("   |   "),
        fontSize: 9,
        color: "#6B7280",
        margin: [0, 0, 0, 10],
    });
    content.push({
        table: {
            headerRows: 1,
            widths: doc.columns.map((c) => (c.width >= 28 ? "*" : "auto")),
            body: [headerCells, ...bodyRows],
        },
        layout: {
            hLineColor: () => "#D1D5DB",
            vLineColor: () => "#D1D5DB",
            paddingTop: () => 4,
            paddingBottom: () => 4,
        },
    });

    const definition: TDocumentDefinitions = {
        pageSize: "A4",
        pageOrientation: "landscape",
        pageMargins: [24, 24, 24, 32],
        defaultStyle: { font: "Helvetica", fontSize: 9 },
        footer: (currentPage, pageCount) => ({
            text: `Seite ${currentPage} von ${pageCount}`,
            alignment: "right",
            fontSize: 8,
            color: "#6B7280",
            margin: [0, 8, 24, 0],
        }),
        content,
    };

    return await createPdf(definition).getBuffer();
};
