export type Theme = "dark" | "light";

const STORAGE_KEY = "jt_theme";

const readStored = (): Theme => {
    if (typeof localStorage === "undefined") return "dark";
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return "dark";
        const parsed = JSON.parse(raw);
        return parsed === "light" ? "light" : "dark";
    } catch {
        return "dark";
    }
};

const theme = ref<Theme>("dark");
let initialized = false;

const applyToDom = (t: Theme) => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", t === "dark");
};

const persist = (t: Theme) => {
    if (typeof localStorage === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
    } catch {
        // ignore quota / private mode errors
    }
};

export const useTheme = () => {
    onMounted(() => {
        if (initialized) return;
        initialized = true;
        theme.value = readStored();
        applyToDom(theme.value);
    });

    const set = (t: Theme) => {
        theme.value = t;
        applyToDom(t);
        persist(t);
    };

    const toggle = () => set(theme.value === "dark" ? "light" : "dark");

    return { theme: readonly(theme), set, toggle };
};
