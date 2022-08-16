import { createClassNameScoper } from "./scoper";

/**
 * From SO, must be perfect?
 * https://stackoverflow.com/a/25456134/153718
 */
export function isDeepEqual(x: any, y: any) {
    if (x === y) {
        return true;
    } else if (
        typeof x == "object" &&
        x != null &&
        typeof y == "object" &&
        y != null
    ) {
        if (Object.keys(x).length !== Object.keys(y).length) return false;

        for (const prop in x) {
            if (y.hasOwnProperty(prop)) {
                if (!isDeepEqual(x[prop], y[prop])) return false;
            } else return false;
        }

        return true;
    } else return false;
}

/**
 * @param ob Remove undefied keys from object. Just makes things cleaner for
 * tests
 */
export function cleanUndefined<T extends {}>(ob: T): T {
    const out = {} as T;

    for (const key in ob) {
        if (ob[key] !== undefined) {
            out[key] = ob[key];
        }
    }

    return out;
}

/**
 * Asserts that given object is not null or undefined
 */
export function assertNonNullable<T>(
    ob: T,
    assertionMessage: string,
): asserts ob is NonNullable<T> {
    if (ob === null || ob === undefined) {
        throw new Error(assertionMessage);
    }
}

export const { scopeClassNames, scopeView } =
    createClassNameScoper<ClassNames>();

export const View = scopeView("findkit");
