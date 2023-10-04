import React, { ReactNode } from "react";
import { useFindkitContext } from "./core-hooks";
import { SearchResultHit } from "./search-engine";
import { isProd, View } from "./utils";

// Rules for slot definitions:
//   - Use interfaces with `@public` tag for the props
//   - Export the interfaces from cdn-entries/index.tsx
//   - Use tsdoc comments for the props
//   - Name the interface as {SlotName}SlotProps
//   - Ensure it looks good at https://docs.findkit.com/ui-api/ui.slots/

/**
 * @public
 */
export interface HeaderSlotProps {
	/**
	 * The original header with the input and the close button
	 */
	children: any;

	/**
	 * Component for the search inpput
	 */
	Input: () => any;

	/**
	 * Component for the close button
	 */
	CloseButton: () => any;
}

/**
 * @public
 */
export interface HitSlotProps {
	/**
	 * The original hit content
	 */
	children: any;

	/**
	 * The hit data
	 */
	hit: SearchResultHit;
}

/**
 * @public
 */
export interface ContentSlotProps {
	/**
	 * The original content
	 */
	children: any;
}

/**
 * @public
 */
export interface LayoutSlotProps {
	/**
	 * The original content
	 */
	children: any;

	/**
	 * The header element
	 */
	header: any;

	/**
	 * The content element
	 */
	content: any;
}

/**
 * @public
 */
export interface Slots {
	/**
	 * Component override for the result item
	 */
	Hit(props: { hit: SearchResultHit }): any;

	/**
	 * Header component which hides automatically when scrolling down
	 */
	Header(props: HeaderSlotProps): any;

	/**
	 * Search result content
	 */
	Content(props: ContentSlotProps): any;

	/**
	 * Layout component which wraps the header and content
	 */
	Layout(props: LayoutSlotProps): any;
}

export interface SlotProps<Name extends keyof Slots> {
	name: Name;
	props: Omit<Parameters<Slots[Name]>[0], "children">;
	children: ReactNode;
}

function SlotError(props: {
	name: string;
	children: ReactNode;
	props: any;
	error: string | null;
}) {
	let propsString = null;
	try {
		propsString = JSON.stringify(props.props, null, 2);
	} catch {}

	return (
		<View cn="slot-error">
			<View cn="slot-error-title">
				Error rendering slot override "{props.name}"
			</View>
			{props.children ? (
				<View cn="slot-error-details">{props.children}</View>
			) : null}
			<View as="pre" cn="slot-error-message">
				{props.error}
			</View>
			{propsString && propsString !== "{}" && !isProd() ? (
				<View as="pre" cn="slot-error-props">
					{propsString}
				</View>
			) : null}
		</View>
	);
}

function SlotInner<Name extends keyof Slots>(props: SlotProps<Name>) {
	const context = useFindkitContext();

	const SlotComponent = context.slots[props.name] as any;

	if (!SlotComponent) {
		return <>{props.children}</>;
	}

	return <SlotComponent {...props.props}>{props.children}</SlotComponent>;
}

export class Slot<Name extends keyof Slots> extends React.Component<
	SlotProps<Name> & { errorFallback?: ReactNode; errorChildren?: ReactNode },
	{ error: string | null }
> {
	constructor(props: any) {
		super(props);
		this.state = { error: null };
	}

	static getDerivedStateFromError(error: Error) {
		return { error: String(error.message ?? error) };
	}

	componentDidCatch(error: any) {
		queueMicrotask(() => {
			console.error(
				`[findkit] Error rendering slot override "${this.props.name}"`,
				this.props.props,
			);
			// Throw the error again out of this stack frame to avoid crashing
			// the app but to generate a global unhandled error which can be
			// capture by error tracking tools like Sentry
			throw error;
		});
	}

	render() {
		if (this.state.error !== null) {
			return (
				this.props.errorFallback ?? (
					<SlotError
						name={this.props.name}
						props={this.props.props}
						error={this.state.error}
					>
						{this.props.errorChildren}
					</SlotError>
				)
			);
		}

		return (
			<SlotInner name={this.props.name} props={this.props.props}>
				{this.props.children}
			</SlotInner>
		);
	}
}
