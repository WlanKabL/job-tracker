import { z } from "zod";
import { APPLICATION_STATUS, TIMELINE_ENTRY_TYPE } from "../enums.js";
import { isoDateSchema, optionalString, trimmedString, uuidSchema } from "./common.js";

export const timelineEntrySchema = z.object({
    id: uuidSchema,
    type: z.enum(TIMELINE_ENTRY_TYPE),
    occurredAt: isoDateSchema,
    title: trimmedString(200),
    description: optionalString(5000),
    fromStatus: z.enum(APPLICATION_STATUS).optional(),
    toStatus: z.enum(APPLICATION_STATUS).optional(),
});

export type TimelineEntry = z.infer<typeof timelineEntrySchema>;

export const timelineEntryCreateSchema = timelineEntrySchema
    .omit({ id: true })
    .extend({
        occurredAt: isoDateSchema.optional(),
    });

export type TimelineEntryCreateInput = z.infer<typeof timelineEntryCreateSchema>;
