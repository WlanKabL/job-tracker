import type { ExportDocumentModel } from "./rows";

const escapeCell = (value: string): string => {
    if (/[";\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
};

/**
 * Semicolon-separated, CRLF line endings, UTF-8 BOM: the combination German
 * Excel opens correctly via double-click without an import wizard.
 */
export const renderCsv = (doc: ExportDocumentModel): Buffer => {
    const lines: string[] = [];
    lines.push(escapeCell(doc.title));
    if (doc.applicantLine) lines.push(escapeCell(doc.applicantLine));
    lines.push(escapeCell(doc.exportedAtLabel));
    if (doc.rangeLabel) lines.push(escapeCell(doc.rangeLabel));
    lines.push(escapeCell(doc.countLabel));
    lines.push("");
    lines.push(doc.columns.map((c) => escapeCell(c.header)).join(";"));
    for (const row of doc.rows) {
        lines.push(row.map((cell) => escapeCell(cell.value)).join(";"));
    }
    if (doc.emptyNotice) lines.push(escapeCell(doc.emptyNotice));
    // U+FEFF byte order mark, spelled out so no invisible character hides in source.
    const bom = String.fromCharCode(0xfeff);
    return Buffer.from(bom + lines.join("\r\n"), "utf8");
};
