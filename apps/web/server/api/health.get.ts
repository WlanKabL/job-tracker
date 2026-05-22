export default defineEventHandler(() => ({
    status: "ok",
    version: useRuntimeConfig().public.appVersion,
    timestamp: new Date().toISOString(),
}));
