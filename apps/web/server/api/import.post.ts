import { z } from "zod";
import {
    applicationSchema,
    companySchema,
    settingsSchema,
} from "@job-tracker/shared";
import { dataFile } from "../utils/paths";
import { getStore } from "../utils/json-store";
import { readBodyAs } from "../utils/validate";

const importBundleSchema = z.object({
    version: z.literal(1),
    exportedAt: z.string().optional(),
    companies: z.array(companySchema),
    applications: z.array(applicationSchema),
    settings: settingsSchema.partial().optional(),
});

interface CompaniesFile {
    version: 1;
    companies: z.infer<typeof companySchema>[];
}

interface ApplicationsFile {
    version: 1;
    applications: z.infer<typeof applicationSchema>[];
}

export default defineEventHandler(async (event) => {
    const bundle = await readBodyAs(event, importBundleSchema);

    const companiesStore = getStore<CompaniesFile>(dataFile("companies.json"), {
        version: 1,
        companies: [],
    });
    const applicationsStore = getStore<ApplicationsFile>(dataFile("applications.json"), {
        version: 1,
        applications: [],
    });

    await companiesStore.write({ version: 1, companies: bundle.companies });
    await applicationsStore.write({ version: 1, applications: bundle.applications });

    if (bundle.settings) {
        const fullSettings = settingsSchema.parse(bundle.settings);
        const settingsStore = getStore(dataFile("settings.json"), fullSettings);
        await settingsStore.write(fullSettings);
    }

    return {
        imported: true,
        counts: {
            companies: bundle.companies.length,
            applications: bundle.applications.length,
        },
    };
});
