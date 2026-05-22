import { type ZodError } from "zod";

export const badRequest = (message: string, data?: unknown) =>
    createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: { message, ...(data ? { details: data } : {}) },
    });

export const notFound = (entity: string) =>
    createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: { message: `${entity} not found` },
    });

export const conflict = (message: string, data?: unknown) =>
    createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: { message, ...(data ? { details: data } : {}) },
    });

export const invalidPayload = (error: ZodError) =>
    createError({
        statusCode: 422,
        statusMessage: "Unprocessable Entity",
        data: {
            message: "Validation failed",
            issues: error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
                code: issue.code,
            })),
        },
    });
