// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
    rules: {
        "vue/multi-word-component-names": "off",
        "vue/html-self-closing": "off",
        "vue/singleline-html-element-content-newline": "off",
        "@typescript-eslint/no-unused-vars": [
            "warn",
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
    },
});
