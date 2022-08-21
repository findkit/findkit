import { createClassNameScoper } from "./scoper";

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
	assertionMessage: string
): asserts ob is NonNullable<T> {
	if (ob === null || ob === undefined) {
		throw new Error(assertionMessage);
	}
}

export const { scopeClassNames, scopeView } =
	createClassNameScoper<ClassNames>();

export const View = scopeView("findkit");
export const cn = scopeClassNames("findkit");
