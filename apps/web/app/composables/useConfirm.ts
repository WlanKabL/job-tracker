export interface ConfirmOptions {
    title: string;
    body: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "danger";
}

interface ConfirmState extends ConfirmOptions {
    open: boolean;
    resolve: ((result: boolean) => void) | null;
}

const state = reactive<ConfirmState>({
    open: false,
    title: "",
    body: "",
    confirmLabel: undefined,
    cancelLabel: undefined,
    variant: "default",
    resolve: null,
});

export const useConfirm = () => {
    const open = (opts: ConfirmOptions): Promise<boolean> =>
        new Promise((resolve) => {
            state.title = opts.title;
            state.body = opts.body;
            state.confirmLabel = opts.confirmLabel;
            state.cancelLabel = opts.cancelLabel;
            state.variant = opts.variant ?? "default";
            state.resolve = resolve;
            state.open = true;
        });

    const close = (result: boolean) => {
        state.open = false;
        state.resolve?.(result);
        state.resolve = null;
    };

    return { state, open, close };
};
