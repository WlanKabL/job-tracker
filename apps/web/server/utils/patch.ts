/**
 * Merges a validated PATCH payload into an existing entity.
 *
 * Key presence is the signal that separates "clear this field" from "leave it
 * untouched": JSON drops keys the client never sent, while Zod keeps the key
 * and yields `undefined` for an explicitly sent empty string. Merging on
 * presence therefore keeps optional fields clearable — filtering `undefined`
 * out instead would make them impossible to reset once set. Fields that end up
 * `undefined` disappear on JSON serialization, matching "field not set".
 */
export const mergePatch = <T extends object>(base: T, patch: Partial<T>): T => ({
    ...base,
    ...patch,
});
