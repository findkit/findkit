const config = {
    parser: "@typescript-eslint/parser",
    extends: ["plugin:react-hooks/recommended"],
    plugins: ["@typescript-eslint"],
    parserOptions: {
        // tsconfigRootDir: __dirname,
        project: "./tsconfig.json",
        sourceType: "module",
        ecmaVersion: 2017,
        ecmaFeatures: {
            jsx: true,
        },
    },
    env: {
        node: true,
        es6: true,
    },
    rules: {
        "prefer-const": "warn",
        "no-var": "error",
        "@typescript-eslint/no-unused-vars": [
            "warn",
            { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
        ],
        // "no-console": "warn",
        "@typescript-eslint/unbound-method": "error",
        "@typescript-eslint/promise-function-async": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/prefer-string-starts-ends-with": "warn",
        eqeqeq: ["error", "smart"],
        "prefer-arrow-callback": "warn",
    },
};

module.exports = config;
