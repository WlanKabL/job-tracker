import type { H3Event } from "h3";
import type { ZodSchema, ZodTypeDef } from "zod";
import { invalidPayload } from "./errors";

export const readBodyAs = async <T>(
    event: H3Event,
    schema: ZodSchema<T, ZodTypeDef, unknown>,
): Promise<T> => {
    const body = await readBody(event);
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw invalidPayload(parsed.error);
    return parsed.data;
};

export const readQueryAs = <T>(
    event: H3Event,
    schema: ZodSchema<T, ZodTypeDef, unknown>,
): T => {
    const query = getQuery(event);
    const parsed = schema.safeParse(query);
    if (!parsed.success) throw invalidPayload(parsed.error);
    return parsed.data;
};
