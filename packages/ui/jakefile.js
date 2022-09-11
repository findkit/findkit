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
	return json.version;
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
				"./src/cdn-entries/index.tsx",
				"./src/cdn-entries/implementation.tsx",
			],
			outdir: options.outdir,
			define: {
				"process.env.NODE_ENV": options.dev ? "'production'" : "'development'",
				__DEV__: options.dev ?? false,
				FINDKIT_VERSION: JSON.stringify(version),
				FINDKIT_MODULE_FORMAT: JSON.stringify(format),
				FINDKIT_CDN_ROOT: options.dev
					? `"http://localhost:28104/build"`
					: `"https://cdn.findkit.com/ui/v${version}"`,
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
			},
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

task("build-npm", ["build-ts", "esbuild-cjs", "api-extractor"]);

task("api-extractor", sh`api-extractor run --local --verbose`);

task("upload", async () => {
	const version = await getVersion();
	await sh`
        aws s3 cp --recursive esm "s3://\${FINDKIT_CDN_S3}/ui/v${version}/esm"
        aws s3 cp --recursive cjs "s3://\${FINDKIT_CDN_S3}/ui/v${version}/cjs"
        aws s3 cp styles.css "s3://\${FINDKIT_CDN_S3}/ui/v${version}/styles.css"

        aws s3 cp demo.html "s3://\${FINDKIT_CDN_S3}/ui/v${version}/demo.html"
        aws s3 cp e2e/shared.css "s3://\${FINDKIT_CDN_S3}/ui/v${version}/demo.css"
    `();
});

task(
	"css",
	sh`NODE_ENV=production postcss styles/index.css --output styles.css`,
);

// XXX Does not work due to
// https://github.com/postcss/postcss-cli/issues/370
// The issue is closed but the issue still remains.
task(
	"watch-css",
	sh`postcss --watch styles/index.css --output e2e/build/styles.css`,
);

task("build-e2e", async () => {
	sh`
        mkdir -p e2e/build
        NODE_ENV=production postcss styles/index.css --output e2e/build/styles.css
    `();

	await runEsbuild({
		dev: true,
		format: "esm",
		outdir: "./e2e/build/esm",
		minify: false,
	});
});

task("build-all", ["clean", "css", "esbuild-esm", "build-npm", "size-limit"]);

task("watch-js", async () => {
	const opts = {
		dev: true,
		format: "esm",
		outdir: "./e2e/build/esm",
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
	"build-ui-api-docs",
	sh`
		rm -rf .temp
		tsc -p tsconfig.build.json
		api-extractor run --local --verbose
		mkdir -p .temp/api-docs-markdown
		api-documenter markdown --input-folder .temp/doc-model --output-folder .temp/api-docs-markdown


		# Install mkdocs just in time in the CI so it can be skipped when we get
		# full cache hit from Turborepo
		if [ "\${CI:-}" != "" ]; then
				sudo apt-get install mkdocs -y
		fi

		mkdocs build
	`,
);
