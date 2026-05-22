/**
 * Normalize a company name for duplicate detection.
 * Lowercases, strips legal-form suffixes ("GmbH", "AG", "Inc.", "Ltd"…),
 * collapses whitespace, drops punctuation. Two strings that normalize equal
 * are considered the same company.
 */
const LEGAL_SUFFIXES = [
    "gmbh & co. kg",
    "gmbh & co kg",
    "gmbh",
    "mbh",
    "ag",
    "se",
    "kg",
    "ohg",
    "ug",
    "ltd",
    "ltd.",
    "limited",
    "llc",
    "llp",
    "lp",
    "inc",
    "inc.",
    "incorporated",
    "corp",
    "corp.",
    "corporation",
    "co",
    "co.",
    "company",
    "plc",
    "bv",
    "sa",
    "s.a.",
    "n.v.",
    "nv",
];

export const normalizeCompanyName = (name: string): string => {
    let n = name.toLowerCase().trim();
    n = n.replace(/[.,/\\()\-_]/g, " ");
    n = n.replace(/\s+/g, " ").trim();
    for (const suffix of LEGAL_SUFFIXES) {
        if (n.endsWith(` ${suffix}`)) {
            n = n.slice(0, -suffix.length - 1).trim();
        }
    }
    return n;
};
