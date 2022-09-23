import React, { ReactNode } from "react";
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

export function Slot<Name extends keyof Slots>(props: {
	name: Name;
	props: Omit<Parameters<Slots[Name]>[0], "children">;
	children: ReactNode;
}) {
	const context = useFindkitContext();

	const SlotComponent = context.slots[props.name] as any;

	if (!SlotComponent) {
		return <>{props.children}</>;
	}

	return <SlotComponent {...props.props}>{props.children}</SlotComponent>;
}
