const path = require("path");

const classNameRegex = /\.([a-zA-Z][a-zA-Z\d_\-]*)/g;

function getFilename(filePath) {
    let fileName = path.basename(filePath);
    let [name] = fileName.split(".");
    if (name === "index") {
        let parts = filePath.split(path.sep);
        name = parts[parts.length - 2];
    }

    return name;
}

/**
 * Returns true when the rule is under :root {}
 */
function isUnderRoot(rule) {
    let current = rule;
    while (current) {
        if (current.selector === ":root") {
            return true;
        }
        current = current.parent;
    }
    return false;
}

function prefixClassNamesWithFilename() {
    return {
        postcssPlugin: "postcss-prefix",
        Once(root) {
            root.walkRules((rule) => {
                if (!rule.selectors) {
                    return rule;
                }

                if (!rule.source.input.file.endsWith(".scoped.css")) {
                    return rule;
                }

                let prefix = getFilename(rule.source.input.file) + "--";

                const isRoot = isUnderRoot(rule);

                rule.selectors = rule.selectors.map((selector) => {
                    return selector.replace(
                        classNameRegex,
                        (match, className) => {
                            if (isRoot) {
                                return "." + className;
                            }

                            return "." + prefix + className;
                        },
                    );
                });
            });
        },
    };
}

module.exports = {
    map: process.env.NODE_ENV !== "production",
    plugins: [
        require("postcss-import-ext-glob"),
        require("postcss-import"),
        prefixClassNamesWithFilename(),
        require("postcss-variables-prefixer")({ prefix: "findkit--" }),
        require("postcss-ts-classnames")({
            dest: "classnames.d.ts",
        }),
        process.env.NODE_ENV === "production"
            ? require("postcss-minify")()
            : null,
    ].filter(Boolean),
};
