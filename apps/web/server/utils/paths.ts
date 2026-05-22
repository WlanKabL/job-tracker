import path from "node:path";

export const dataDir = (): string => {
    const cfg = useRuntimeConfig();
    return cfg.dataDir;
};

export const dataFile = (filename: string): string => path.join(dataDir(), filename);

export const backupDir = (): string => path.join(dataDir(), "backups");
