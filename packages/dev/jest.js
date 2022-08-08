module.exports = {
    testEnvironment: "node",
    testPathIgnorePatterns: ["/node_modules", "dist", ".build"],
    testRegex: "(/__tests__/.+\\.(test|spec))\\.[jt]sx?$",
    transform: {
        "^.+\\.tsx?$": ["babel-jest", require("./babel-node")],
    },
    moduleFileExtensions: ["ts", "tsx", "js"],
    maxWorkers: process.platform === "darwin" ? "50%" : "100%",
    // Automatically clear mock calls, instances and results before every test
    clearMocks: true,
    restoreMocks: true,
    globalSetup: __dirname + "/jest-setup.js",

    // Workaround for
    //
    //     Cannot find module '#node-web-compat' from '../../node_modules/.pnpm/aws-jwt-verify@3.0.0/node_modules/aws-jwt-verify/dist/cjs/https.js'
    //
    // https://github.com/ottokruse/jest-subpath-import/blob/fd43a9117b031fc5b980e80fa3f1d170c7d78d80/jest.config.fix.js
    // https://github.com/facebook/jest/issues/12270
    moduleNameMapper: {
        "#node-web-compat": "./node-web-compat-node.js",
    },
};
