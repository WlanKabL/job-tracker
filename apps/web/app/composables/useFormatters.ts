const dateFormatter = new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("de-DE", { numeric: "auto" });

export const formatDate = (input: string | Date | null | undefined): string => {
    if (!input) return "—";
    const date = typeof input === "string" ? new Date(input) : input;
    if (Number.isNaN(date.getTime())) return "—";
    return dateFormatter.format(date);
};

export const formatDateTime = (input: string | Date | null | undefined): string => {
    if (!input) return "—";
    const date = typeof input === "string" ? new Date(input) : input;
    if (Number.isNaN(date.getTime())) return "—";
    return dateTimeFormatter.format(date);
};

export const formatRelative = (input: string | Date | null | undefined): string => {
    if (!input) return "—";
    const date = typeof input === "string" ? new Date(input) : input;
    if (Number.isNaN(date.getTime())) return "—";
    const diffMs = date.getTime() - Date.now();
    const diffDays = Math.round(diffMs / 86_400_000);
    if (Math.abs(diffDays) >= 7) return formatDate(date);
    return relativeFormatter.format(diffDays, "day");
};

const currencyFormatters = new Map<string, Intl.NumberFormat>();

const getCurrencyFormatter = (currency: string): Intl.NumberFormat => {
    const key = currency.toUpperCase();
    const existing = currencyFormatters.get(key);
    if (existing) return existing;
    const formatter = new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: key,
        maximumFractionDigits: 0,
    });
    currencyFormatters.set(key, formatter);
    return formatter;
};

export const formatSalaryRange = (
    min: number | undefined,
    max: number | undefined,
    currency = "EUR",
): string | null => {
    if (min === undefined && max === undefined) return null;
    const formatter = getCurrencyFormatter(currency);
    if (min !== undefined && max !== undefined) {
        return `${formatter.format(min)} – ${formatter.format(max)}`;
    }
    if (min !== undefined) return `ab ${formatter.format(min)}`;
    if (max !== undefined) return `bis ${formatter.format(max)}`;
    return null;
};

export const daysBetween = (a: string | Date, b: string | Date = new Date()): number => {
    const aDate = typeof a === "string" ? new Date(a) : a;
    const bDate = typeof b === "string" ? new Date(b) : b;
    return Math.round((aDate.getTime() - bDate.getTime()) / 86_400_000);
};
