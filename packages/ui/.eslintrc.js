module.exports = {
    extends: ["@findkit/eslint-config"],
    plugins: ["react", "react-hooks", "@typescript-eslint"],
    parserOptions: {
        tsconfigRootDir: __dirname,
    },
    rules: {
        // Bad with regenerator bundling (IE support)
        "@typescript-eslint/promise-function-async": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
    },
};
