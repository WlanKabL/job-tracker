import { z } from "zod";
import { isoDateSchema, optionalString, trimmedString, uuidSchema } from "./common.js";

export const openQuestionSchema = z.object({
    id: uuidSchema,
    question: trimmedString(500),
    answer: optionalString(5000),
    askedAt: isoDateSchema.optional(),
    answeredAt: isoDateSchema.optional(),
    createdAt: isoDateSchema,
});

export type OpenQuestion = z.infer<typeof openQuestionSchema>;

export const openQuestionCreateSchema = openQuestionSchema.omit({ id: true, createdAt: true });

export type OpenQuestionCreateInput = z.infer<typeof openQuestionCreateSchema>;

export const openQuestionUpdateSchema = openQuestionCreateSchema.partial();

export type OpenQuestionUpdateInput = z.infer<typeof openQuestionUpdateSchema>;
