// See update-imports script in package.json
import { readFile, writeFile } from "fs/promises";

const file = process.argv[2];

const VERSION = "0.0.1-dev.ac62036680";

function update(s) {
	return s.replace(/\/ui\/v(.+?)\//, () => `/ui/v${VERSION}/`);
}

if (!file) {
	process.exit(1);
}

const content = await readFile(file, "utf8");
await writeFile(file, update(content));
