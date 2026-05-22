import tailwindcss from "@tailwindcss/vite";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    ssr: false,
    devtools: { enabled: process.env.NODE_ENV !== "production" },
    devServer: { port: 3000 },
    css: ["~/assets/tailwind.css"],
    experimental: {
        typedPages: true,
    },
    modules: ["@nuxt/eslint", "@nuxt/icon", "@pinia/nuxt", "@vueuse/nuxt"],
    icon: {
        serverBundle: { collections: ["lucide", "simple-icons"] },
    },
    app: {
        head: {
            htmlAttrs: { lang: "de" },
            title: "Job Tracker",
            titleTemplate: "%s · Job Tracker",
            meta: [
                { charset: "utf-8" },
                { name: "viewport", content: "width=device-width, initial-scale=1" },
                { name: "theme-color", content: "#0a0a0a" },
            ],
            link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
            script: [
                {
                    innerHTML: `(function(){try{var v=localStorage.getItem('jt_theme');if(v){v=JSON.parse(v);}if(v==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`,
                    type: "text/javascript",
                },
            ],
        },
    },
    typescript: {
        strict: true,
        typeCheck: false,
    },
    alias: {
        "@": resolve(__dirname, "."),
        "~": resolve(__dirname, "app"),
    },
    runtimeConfig: {
        dataDir: process.env.JT_DATA_DIR || resolve(__dirname, "data"),
        public: {
            appVersion: process.env.npm_package_version || "dev",
        },
    },
    vite: {
        plugins: [tailwindcss()],
        build: {
            minify: true,
        },
    },
});
