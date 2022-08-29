import React from "react";
import { ElementType, forwardRef } from "react";

export type ScopeCSS<
	Prefix extends string,
	Values extends string,
> = Values extends `${Prefix}--${infer rest}` ? rest : never;

export interface ScopedStyle {
	__scoped: string;
}

function isScopedStyle(style: any): style is ScopedStyle {
	return Boolean(style && typeof style === "object" && "__scoped" in style);
}

/**
 * See __tests__/scoper.test.tsx
 */
export function createClassNameScoper<KnownStyles extends string>() {
	function scopeClassNames<Prefix extends string>(scope: Prefix) {
		type ScopedClassNames = ScopeCSS<Prefix, KnownStyles>;
		type ScopedStyleObject = Partial<
			Record<ScopedClassNames, boolean | undefined | null>
		>;

		type Args<T> = ScopedClassNames extends never
			? never
			: T | ScopedClassNames | ScopedStyleObject | null | false | undefined;

		function classNames(...names: Args<ScopedStyle>[]): string {
			return names
				.flatMap((n) => {
					if (!n) {
						return [];
					}

					if (typeof n === "string") {
						return [`${scope}--${n}`];
					}

					if (isScopedStyle(n)) {
						return [n.__scoped];
					}

					return Object.entries(n).flatMap(([className, inUse]) => {
						if (inUse) {
							return classNames(className as any);
						}

						return [];
					});
				})
				.join(" ");
		}

		classNames.nest = (...names: Args<ScopedStyle>[]): ScopedStyle => {
			return {
				__scoped: classNames(...names),
			};
		};

		Object.assign(classNames, { cn: classNames });

		return classNames;
	}

	function scopeView<Prefix extends string>(prefix: Prefix) {
		const scopeCSS = scopeClassNames(prefix);

		type ViewProps<T> = {
			as?: T;
			cn?: Parameters<typeof scopeCSS> | Parameters<typeof scopeCSS>[0];
			ref?: React.Ref<
				T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : T
			>;
			children?: React.ReactNode;
		};

		function ViewType<T extends ElementType = "div">(
			_props: React.ComponentPropsWithoutRef<T> & ViewProps<T>,
		): JSX.Element {
			return <></>;
		}

		const View: typeof ViewType = forwardRef(
			({ as, cn, ...props }: any, ref) => {
				const Component = as || "div";
				const cnArgs = Array.isArray(cn) ? cn : [cn];

				const classes = [props.className, cn ? scopeCSS(...cnArgs) : null]
					.filter(Boolean)
					.join(" ");

				return <Component {...props} className={classes} ref={ref} />;
			},
		) as any;

		Object.assign(View, { displayName: `View[${prefix}]` });
		return View;
	}

	return { scopeClassNames, scopeView };
}
