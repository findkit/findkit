const esbuild = require("esbuild");
const alias = require("esbuild-plugin-alias");

const preact = require.resolve("preact/compat");

const res = esbuild.build({
    bundle: true,
    minify: false,
    mangleProps: /_x_$/,
    target: "es2020",
    entryPoints: ["./example/basic.tsx"],
    outdir: "./example/dist",
    define: {
        NODE_ENV: "production",
    },
    plugins: [
        alias({
            react: preact,
            "react-dom": preact,
        }),
    ],
});

console.log(res);
