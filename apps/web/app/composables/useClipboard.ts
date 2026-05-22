export const useClipboardCopy = () => {
    const toast = useToast();
    const t = useT();

    return async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(t.toast.copied);
        } catch {
            toast.error(t.toast.error);
        }
    };
};
