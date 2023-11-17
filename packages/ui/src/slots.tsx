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

	parts: {
		TitleLink(props: { hit: SearchResultHit }): any;
		Highlight(props: { hit: SearchResultHit }): any;
		URLLink(props: { hit: SearchResultHit }): any;
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
		Title(props: { title: string; total: number }): any;
		Footer(props: {
			total: number;
			fetchedHits: number;
			id: string;
			title: string;
		}): any;
		Hits(props: {
			id: string;
			total: number;
			title: string;
			hits: ReadonlyArray<SearchResultHit>;
			previewSize: number | undefined;
		}): any;
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
	 * The magnifying glass icon in the default search input
	 */
	SearchInputIcon(props: { children: any }): any;

	/**
	 * Slot for a group of results when using multiple groups
	 */
	Group(props: GroupSlotProps): any;
}
