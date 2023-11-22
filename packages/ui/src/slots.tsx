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
	 *
	 * @deprecated use parts.Input instead
	 */
	Input: (props: { placeholder?: string }) => any;

	/**
	 * Component for the close button
	 *
	 * @deprecated use parts.CloseButton instead
	 */
	CloseButton: () => any;

	parts: {
		/**
		 * Component for the search inpput
		 */
		Input: (props: { placeholder?: string; logo?: any }) => any;

		/**
		 * Component for the close button
		 */
		CloseButton: () => any;
	};
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

	parts: {
		TitleLink(props: {
			title?: any;
			superwordsMatch?: boolean;
			url?: string;
		}): any;
		Highlight(props: { highlight?: string }): any;
		URLLink(props: { url?: string }): any;
	};
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
 *
 * Props for AllResultsLink component in Group slot parts
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

	parts: {
		Title(props: { title?: string; children?: any }): any;
		Hits(props: {}): any;
		ShowAllLink(props: ShowAllLinkProps): any;
	};
}

/**
 * @public
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
