import PathUtils from "path";
import { promises as fs } from "fs";

export function getInitialCWD() {
    const cwd = process.env.FINKDIT_TEST_INITIAL_CWD;
    if (!cwd) {
        throw new Error(
            "FINKDIT_TEST_INITIAL_CWD not defined. Jest globalSetup broken in @findkit/dev?",
        );
    }

    return cwd;
}

export function resetCWD() {
    process.chdir(getInitialCWD());
}

export function testCases<T>(
    desc: {
        describe: string;
        test?: null | ((data: T) => string);
    },
    ...table: (T & { test?: string; only?: boolean; skip?: boolean })[]
) {
    return (implementation: (context: T) => any) => {
        describe(desc.describe, () => {
            table.forEach((testCase) => {
                const anyContext: any = testCase;
                let testFn = test;

                if (anyContext.only) {
                    testFn = test.only;
                }

                if (anyContext.skip) {
                    testFn = test.skip;
                }

                testFn(
                    anyContext.test ||
                        (desc.test?.(testCase) ?? "No test name!"),
                    async () => {
                        await implementation(testCase);
                    },
                );
            });
        });
    };
}

/**
 * Genearte unique id from the magic __filename global
 */
export function filenameToId(filename: string) {
    return PathUtils.basename(filename)
        .replace(/\.test\.tsx?/, "")
        .replace(/[^a-z]+/g, "_");
}

/**
 * Sequence number to generate multiple unique tmp dirs within a test suite
 */
let tmpDirSequence = 0;

/**
 * Setup empty but existing tmp directory for each test and test suite
 */
export function setupTMPDir(filename: string) {
    tmpDirSequence++;
    const id = tmpDirSequence;
    const dir = PathUtils.join(
        process.env.TMPDIR ?? "/tmp",
        "findkit",
        String(id),
        filenameToId(filename),
    );

    beforeEach(async () => {
        resetCWD();
        if (process.cwd().startsWith(dir)) {
            throw new Error("Cannot clear tmpdir. CWD is still inside it.");
        }

        await fs.rm(dir, { recursive: true, force: true });
        await fs.mkdir(dir, { recursive: true });
    });

    return dir;
}

/**
 * Override environment variables temporarily for tests. Automatically restores
 * env after each test
 */
export function setupEnv<AllowedKeys extends string>(testEnv: {
    [P in AllowedKeys]?: string;
}) {
    const origValues: Record<string, string | undefined> = {};

    for (const key of Object.keys(testEnv)) {
        origValues[key] = process.env[key];
    }

    beforeEach(() => {
        Object.assign(process.env, testEnv);
    });

    afterEach(() => {
        Object.assign(process.env, origValues);
    });
}
