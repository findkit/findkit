module.exports = {
	extends: ["@findkit/eslint-config"],
	parserOptions: {
		tsconfigRootDir: __dirname,
	},
	ignorePatterns: ["e2e/build/**"],
};
