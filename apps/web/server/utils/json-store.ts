import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureDailyBackup } from "./backup";

/**
 * Atomic, lock-serialized JSON file store. One instance per file path.
 * Reads are cached in memory after first load; writes go through a serialized
 * queue + atomic rename so the on-disk file is never partial.
 */
export class JsonFileStore<TData> {
    private cache: TData | null = null;
    private writeQueue: Promise<unknown> = Promise.resolve();

    constructor(
        private readonly filePath: string,
        private readonly defaultValue: TData,
    ) {}

    async read(): Promise<TData> {
        if (this.cache !== null) return this.cache;
        try {
            const raw = await fs.readFile(this.filePath, "utf8");
            this.cache = JSON.parse(raw) as TData;
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
            this.cache = structuredClone(this.defaultValue);
            await this.atomicWrite(this.cache);
        }
        return this.cache;
    }

    async write(data: TData): Promise<void> {
        this.cache = data;
        const previous = this.writeQueue;
        this.writeQueue = previous
            .catch(() => undefined)
            .then(async () => {
                await ensureDailyBackup(path.dirname(this.filePath));
                await this.atomicWrite(data);
            });
        await this.writeQueue;
    }

    async mutate<R = undefined>(
        mutator: (current: TData) => TData | Promise<TData>,
        result?: (next: TData) => R,
    ): Promise<R extends undefined ? TData : R> {
        const current = await this.read();
        const cloned = structuredClone(current);
        const next = await mutator(cloned);
        await this.write(next);
        return (result ? result(next) : next) as R extends undefined ? TData : R;
    }

    /** Force-reload from disk on next read (testing/debug only). */
    invalidate(): void {
        this.cache = null;
    }

    private async atomicWrite(data: TData): Promise<void> {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        const tmp = `${this.filePath}.tmp-${process.pid}-${Date.now()}`;
        await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
        await fs.rename(tmp, this.filePath);
    }
}

const stores = new Map<string, JsonFileStore<unknown>>();

/** Singleton resolver — same path → same store instance. */
export const getStore = <T>(filePath: string, defaultValue: T): JsonFileStore<T> => {
    const existing = stores.get(filePath);
    if (existing) return existing as JsonFileStore<T>;
    const store = new JsonFileStore<T>(filePath, defaultValue);
    stores.set(filePath, store as JsonFileStore<unknown>);
    return store;
};
