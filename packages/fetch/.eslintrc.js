module.exports = {
    extends: ["@findkit/eslint-config"],
    parserOptions: {
        tsconfigRootDir: __dirname,
    },
    rules: {
        // Bad with regenerator bundling (IE support)
        "@typescript-eslint/promise-function-async": "off",
    },
};
