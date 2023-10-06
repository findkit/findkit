import React, { ReactNode } from "react";
import { ErrorContainer } from "./components";
import { useFindkitContext } from "./core-hooks";
import { SearchResultHit } from "./search-engine";

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
	Hit(props: { hit: SearchResultHit; children: any }): any;

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

	/**
	 * The magnifying glass icon in the default search input
	 */
	SearchInputIcon(props: { children: any }): any;
}

export interface SlotProps<Name extends keyof Slots> {
	name: Name;
	props: Omit<Parameters<Slots[Name]>[0], "children">;
	children: ReactNode;
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
					<ErrorContainer
						title={`Error rendering slot "${this.props.name}"`}
						props={this.props.props}
						error={this.state.error}
					>
						{this.props.errorChildren}
					</ErrorContainer>
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
