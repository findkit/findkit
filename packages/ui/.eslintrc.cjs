module.exports = {
	extends: ["@findkit/eslint-config"],
	parserOptions: {
		tsconfigRootDir: __dirname,
	},
	ignorePatterns: ["tests/build/**"],
};
