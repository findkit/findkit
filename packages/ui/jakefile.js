const { task } = require("jake");
const fs = require("fs/promises");
const { sh } = require("sh-thunk");
const watcher = require("@parcel/watcher");
const { execSync } = require("child_process");

const esbuild = require("esbuild");
const alias = require("esbuild-plugin-alias");

const gitRev = execSync("git rev-parse HEAD").toString().trim();

const preactPath = require.resolve("preact/compat");

async function getVersion() {
	if (!process.env.GITHUB_REF) {
		return `local-${gitRev}`;
	}

	const pkg = await fs.readFile("./package.json");
	const json = JSON.parse(pkg.toString());
	return "v" + json.version;
}

async function runEsbuild(options = {}) {
	const format = options?.format ?? "esm";
	const version = await getVersion();

	const result = await esbuild
		.build({
			bundle: true,
			minify: options.minify,
			target: "es2022",
			format,
			tsconfig: "tsconfig.esbuild.json",
			sourcemap: true,
			metafile: options.metafile ?? false,
			entryPoints: [
				"./src/cdn-entries/lazy.tsx",
				"./src/cdn-entries/modal.tsx",
			],
			outdir: options.outdir,
			define: {
				"process.env.NODE_ENV": options.dev ? "'production'" : "'development'",
				__DEV__: options.dev ?? false,
				FINDKIT_VERSION: JSON.stringify(version),
				FINDKIT_CDN_ROOT: options.dev
					? `"http://localhost:28104/build"`
					: `"https://cdn.findkit.com/ui/${version}"`,
			},
			plugins: [
				alias({
					react: preactPath,
					"react-dom": preactPath,
				}),
			],
		})
		.then(
			() => {
				console.log("JS ok!");
			},
			() => {
				// esbuild logs the error itself
			}
		);

	return result;
}

task("size-limit", sh`size-limit`);

task("clean", sh`rm -rf dist temp docs cjs esm`);

task("esbuild-esm", async () => {
	await runEsbuild({
		format: "esm",
		minify: true,
		outdir: "./esm",
	});
});

task("esbuild-cjs", async () => {
	await runEsbuild({ format: "cjs", outdir: "./cjs", minify: false });
});

task("analyze", ["clean"], async () => {
	const res = await runEsbuild({
		metafile: true,
		outdir: "./esm",
		format: "esm",
	});
	if (!res) {
		return;
	}
	let text = await esbuild.analyzeMetafile(res.metafile);
	console.log(text);
});

task(
	"build-npm",
	["build-ts", "esbuild-cjs"],
	sh`
      api-extractor run --local --verbose
    `
);

task("upload", async () => {
	const version = await getVersion();
	await sh`
        aws s3 cp --recursive esm "s3://\${FINDKIT_CDN_S3}/ui/${version}"
        aws s3 cp styles.css "s3://\${FINDKIT_CDN_S3}/ui/${version}/styles.css"
    `();
});

task(
	"css",
	sh`NODE_ENV=production postcss styles/index.css --output styles.css`
);

task(
	"watch-css",
	sh`postcss --watch styles/index.css --output tests/build/styles.css`
);

task("build-test", async () => {
	sh`
        mkdir -p tests/build
        NODE_ENV=production postcss styles/index.css --output tests/build/styles.css
    `();

	await runEsbuild({
		dev: true,
		format: "esm",
		outdir: "./tests/build",
		minify: false,
	});
});

task("build-all", ["clean", "css", "esbuild-esm", "build-npm", "size-limit"]);

task("watch-js", async () => {
	const opts = {
		dev: true,
		format: "esm",
		outdir: "./tests/build",
		minify: false,
	};

	void watcher.subscribe("src", (err, events) => {
		if (err) {
			console.error("Watch error:", err);
			return;
		}

		console.log("Changed files:", events.map((e) => e.path).join(", "));

		void runEsbuild(opts);
	});

	void runEsbuild(opts);

	await new Promise(() => {});
});

task("build-ts", sh`tsc -p tsconfig.build.json`);

task(
	"build-docs",
	sh`rm -rf dist docs temp && tsc -p tsconfig.build.json && api-extractor run --local --verbose && api-documenter markdown --input-folder temp --output-folder docs`
);
