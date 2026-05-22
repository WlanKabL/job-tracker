export type ToastType = "success" | "error" | "info";

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

const toasts = ref<Toast[]>([]);

const dismiss = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
};

const push = (type: ToastType, message: string, durationMs = 4000) => {
    const id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
    toasts.value = [...toasts.value, { id, type, message }];
    if (durationMs > 0) {
        window.setTimeout(() => dismiss(id), durationMs);
    }
    return id;
};

export const useToast = () => ({
    toasts: readonly(toasts),
    success: (msg: string) => push("success", msg),
    error: (msg: string) => push("error", msg, 6000),
    info: (msg: string) => push("info", msg),
    dismiss,
});
