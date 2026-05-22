import { promises as fs } from "node:fs";
import path from "node:path";

const BACKED_UP_FILES = ["applications.json", "companies.json", "settings.json"] as const;

const lastBackupByDir = new Map<string, string>();

/**
 * Copies all known JSON files into `<dataDir>/backups/<YYYY-MM-DD>/` once per day.
 * Safe to call before every write — cheap when today's backup already exists.
 */
export const ensureDailyBackup = async (dataDir: string): Promise<void> => {
    const today = isoDay(new Date());
    if (lastBackupByDir.get(dataDir) === today) return;

    const targetDir = path.join(dataDir, "backups", today);
    try {
        await fs.access(targetDir);
        lastBackupByDir.set(dataDir, today);
        return;
    } catch {
        // proceed
    }

    await fs.mkdir(targetDir, { recursive: true });

    await Promise.all(
        BACKED_UP_FILES.map(async (file) => {
            const src = path.join(dataDir, file);
            const dest = path.join(targetDir, file);
            try {
                await fs.copyFile(src, dest);
            } catch (err) {
                if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
            }
        }),
    );

    lastBackupByDir.set(dataDir, today);
};

export const listBackups = async (dataDir: string): Promise<string[]> => {
    const dir = path.join(dataDir, "backups");
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        return entries
            .filter((e) => e.isDirectory())
            .map((e) => e.name)
            .sort()
            .reverse();
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw err;
    }
};

const isoDay = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};
