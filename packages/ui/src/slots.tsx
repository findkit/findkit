import { SearchResultHit } from "./search-engine";

// Rules for slot definitions:
//   - Use interfaces with `@public` tag for the props
//   - Export the interfaces from cdn-entries/index.tsx
//   - Use tsdoc comments for the props
//   - Name the interface as {SlotName}SlotProps
//   - Ensure it looks good at https://docs.findkit.com/ui-api/ui.slots/

/**
 * @public
 *
 * Part components for the Header slot.
 * See {@link Slots}.
 */
export interface HeaderSlotParts {
	/**
	 * Component for the search inpput
	 */
	Input: (props: { placeholder?: string; icon?: any }) => any;

	/**
	 * Component for the close button
	 *
	 */
	CloseButton: (props: { children?: any }) => any;
}

/**
 * @public
 *
 * Props for the Header slot component override.
 * See {@link Slots}.
 */
export interface HeaderSlotProps {
	/**
	 * The original header with the input and the close button
	 */
	children: any;

	/**
	 * Component for the search inpput
	 *
	 * @deprecated use parts.Input instead
	 */
	Input: (props: { placeholder?: string }) => any;

	/**
	 * Component for the close button
	 *
	 * @deprecated use parts.CloseButton instead
	 */
	CloseButton: (props: { children?: any }) => any;

	/**
	 * Part components for the header
	 *
	 * New in 0.14.0
	 */
	parts: HeaderSlotParts;
}

/**
 * @public
 *
 * Part components for the Hit slot.
 * See {@link Slots}.
 */
export interface HitSlotParts {
	/**
	 * The hit title
	 */
	TitleLink(props: {
		children?: any;
		superwordsMatch?: boolean;
		href?: string;
	}): any;

	/**
	 * The highlights based on the search terms
	 */
	Highlight(props: { highlight?: string }): any;

	/**
	 * The url as a link
	 */
	URLLink(props: { href?: string; children?: any }): any;
}

/**
 * @public
 *
 * Props for the Hit slot component override.
 * See {@link Slots}.
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

	/**
	 * Group id
	 */
	groupId: string;

	/**
	 * Part components for the hit
	 *
	 * New in 0.14.0
	 */
	parts: HitSlotParts;
}

/**
 * @public
 *
 * Props for the Content slot component override.
 * See {@link Slots}.
 */
export interface ContentSlotProps {
	/**
	 * The original content
	 */
	children: any;
}

/**
 * @public
 *
 * Props for the Layout slot component override.
 * See {@link Slots}.
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
 *
 * Props for AllResultsLink component in Group slot parts.
 * See {@link Slots}.
 */
export interface ShowAllLinkProps {
	/**
	 * Element to render inside the link when there are more results show
	 */
	children?: any;

	/**
	 * Render when there are no results
	 */
	noResults?: any;

	/**
	 * Render when all resuls are already shown
	 */
	allResultsShown?: any;

	/**
	 * Link aria-label
	 */
	title?: string;
}

/**
 * @public
 *
 * Part components for the Group slot
 */
export interface GroupSlotParts {
	/**
	 * The group title
	 */
	Title(props: { title?: string; children?: any }): any;

	/**
	 * Hits shown in the group
	 */
	Hits(props: {}): any;

	/**
	 * Component for the "show all" link
	 */
	ShowAllLink(props: ShowAllLinkProps): any;
}

/**
 * @public
 */
export interface GroupSlotProps {
	/**
	 * The original content
	 */
	children: any;

	id: string;

	title: string;

	total: number;

	fetchedHits: number;

	hits: ReadonlyArray<SearchResultHit>;

	previewSize: number | undefined;

	/**
	 * Part components for the group
	 *
	 * New in 0.14.0
	 */
	parts: GroupSlotParts;
}

/**
 * @public
 *
 * All avaivable slots
 */
export interface Slots {
	/**
	 * Component override for the result item
	 */
	Hit(props: HitSlotProps): any;

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
	 * Slot for a group of results when using multiple groups
	 */
	Group(props: GroupSlotProps): any;
}
