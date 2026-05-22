/**
 * Cleans ChatGPT's "creative" JSON output before validation.
 *
 * Why this exists: ChatGPT tends to
 *   - wrap URLs in markdown link syntax: `[https://x.de](https://x.de)`
 *   - wrap emails as mailto links: `[a@b.de](mailto:a@b.de)`
 *   - leave placeholder strings like `[Klären: ...]` for fields it could not determine
 *
 * The preprocessor walks the payload recursively and rewrites those into the
 * raw values, returning both the cleaned payload AND a report of what changed
 * so the user can see what we silently fixed.
 */

export interface PreprocessReport {
    /** Field paths where a markdown URL/email wrapper was unwrapped to the bare value. */
    unwrappedLinks: string[];
    /** Field paths where a `[Klären: ...]` placeholder was stripped (value became undefined). */
    strippedPlaceholders: string[];
    /** Field paths where a `[Klären: question]` was kept but the bracket wrapper removed (openQuestions context). */
    unwrappedQuestionMarkers: string[];
}

const PLACEHOLDER_RE = /^\[(klären|kläre|todo|tbd|tbc|unknown)\b[^\]]*\]$/i;
const PLACEHOLDER_PREFIX_RE = /^\[(?:klären|kläre|todo|tbd|tbc|unknown)\b[^:]*:\s*/i;
const MARKDOWN_LINK_RE = /^\s*\[([^\]]+)\]\(([^)]+)\)\s*$/;

const tryUnwrap = (raw: string): string | null => {
    const match = raw.match(MARKDOWN_LINK_RE);
    if (!match) return null;
    const inner = match[2]!.trim();
    if (inner.startsWith("mailto:")) return inner.slice("mailto:".length);
    if (inner.startsWith("tel:")) return inner.slice("tel:".length);
    if (/^https?:\/\//i.test(inner)) return inner;
    return null;
};

const isPlaceholder = (raw: string): boolean => PLACEHOLDER_RE.test(raw.trim());

/** Strip the `[Klären: ` prefix and trailing `]` from an open-question item. */
const stripQuestionMarker = (raw: string): string => {
    let cleaned = raw.trim();
    const beforePrefix = cleaned;
    cleaned = cleaned.replace(PLACEHOLDER_PREFIX_RE, "");
    if (cleaned !== beforePrefix && cleaned.endsWith("]")) {
        cleaned = cleaned.slice(0, -1);
    }
    return cleaned.trim();
};

const join = (a: string, b: string | number): string => {
    if (a === "") return String(b);
    if (typeof b === "number") return `${a}[${b}]`;
    return `${a}.${b}`;
};

/** Paths where placeholders are CONTENT (don't strip — unwrap the wrapper instead). */
const isQuestionPath = (path: string): boolean =>
    path === "openQuestions" || path.startsWith("openQuestions[");

const walk = (value: unknown, path: string, report: PreprocessReport): unknown => {
    if (typeof value === "string") {
        if (isPlaceholder(value)) {
            if (isQuestionPath(path)) {
                const cleaned = stripQuestionMarker(value);
                if (cleaned.length > 0) {
                    report.unwrappedQuestionMarkers.push(path);
                    return cleaned;
                }
                report.strippedPlaceholders.push(path);
                return undefined;
            }
            report.strippedPlaceholders.push(path);
            return undefined;
        }
        const unwrapped = tryUnwrap(value);
        if (unwrapped !== null) {
            report.unwrappedLinks.push(path);
            return unwrapped;
        }
        return value;
    }
    if (Array.isArray(value)) {
        const cleaned: unknown[] = [];
        value.forEach((item, idx) => {
            const next = walk(item, join(path, idx), report);
            if (next !== undefined) cleaned.push(next);
        });
        return cleaned;
    }
    if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            const next = walk(v, join(path, k), report);
            if (next !== undefined) out[k] = next;
        }
        return out;
    }
    return value;
};

export const preprocessImportPayload = <T = unknown>(
    raw: unknown,
): { value: T; report: PreprocessReport } => {
    const report: PreprocessReport = {
        unwrappedLinks: [],
        strippedPlaceholders: [],
        unwrappedQuestionMarkers: [],
    };
    const value = walk(raw, "", report) as T;
    return { value, report };
};

/**
 * Strip a leading and trailing markdown code fence (3 or more backticks, optional
 * language tag like `json`) from a raw text input. Used before `JSON.parse` so the
 * user can paste the ChatGPT output exactly as it appears — including the
 * surrounding ``````json ... `````` block — without manually trimming.
 *
 * Returns the original (trimmed) string if no fence is detected.
 */
export const stripCodeFences = (raw: string): string => {
    const trimmed = raw.trim();
    const open = trimmed.match(/^`{3,}[a-zA-Z0-9_-]*\s*\r?\n/);
    if (!open) return trimmed;
    let body = trimmed.slice(open[0].length);
    body = body.replace(/\r?\n?\s*`{3,}\s*$/, "");
    return body.trim();
};

/**
 * Try to parse a salary range from a free-form string like
 * "60000-75000 EUR yearly" or "70000-100000 EUR yearly plus bonus".
 */
export interface ParsedSalaryRange {
    min: number;
    max: number;
    currency: string;
    period: "yearly" | "monthly" | "hourly" | "daily";
}

const SALARY_RE =
    /(\d{4,7})\s*[-–—]\s*(\d{4,7})\s*([A-Z]{3})?\s*(yearly|monthly|hourly|daily|jährlich|jahr|monatlich|monat|stunde|tag)?/i;

const PERIOD_MAP: Record<string, ParsedSalaryRange["period"]> = {
    yearly: "yearly",
    jährlich: "yearly",
    jahr: "yearly",
    monthly: "monthly",
    monatlich: "monthly",
    monat: "monthly",
    hourly: "hourly",
    stunde: "hourly",
    daily: "daily",
    tag: "daily",
};

export const parseSalaryRange = (raw: string | undefined): ParsedSalaryRange | null => {
    if (!raw) return null;
    const match = raw.match(SALARY_RE);
    if (!match) return null;
    const min = Number(match[1]);
    const max = Number(match[2]);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;
    const currency = (match[3] ?? "EUR").toUpperCase();
    const periodToken = (match[4] ?? "yearly").toLowerCase();
    const period = PERIOD_MAP[periodToken] ?? "yearly";
    return { min, max, currency, period };
};
