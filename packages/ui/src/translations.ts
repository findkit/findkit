/**
 * @public
 *
 * UI strings available for translation
 */
export interface TranslationStrings {
	/**
	 * Text on the show all link
	 */
	"show-all": string;

	/**
	 * Aria label on the "show all" link shown on the multiple group view
	 */
	"aria-show-all": string;

	/**
	 * Text shown when all search results are shown
	 */
	"all-results-shown": string;

	/**
	 * Texton the load more button
	 */
	"load-more": string;

	/**
	 *  Text on the back button when user has navigated to a group
	 */
	"go-back": string;

	/**
	 * Aria label on the close search button
	 */
	"aria-label-close-search": string;

	/**
	 * Aria label on the close button
	 */
	close: string;

	/**
	 * Aria label on the search input
	 */
	"aria-label-search-input": string;

	/**
	 * Text shown on the Hit list when there is no search results
	 */
	"no-results": string;

	/**
	 * Aria description on the search input
	 */
	"sr-search-instructions": string;

	/**
	 * Additional aria description on the search input when using modal mode
	 */
	"sr-search-instructions-modal": string;

	/**
	 * `title` attribute on the superwords match star icon
	 */
	"superwords-match": string;

	/**
	 * Error title when the search fails
	 */
	"error-title": string;

	/**
	 * Text on the try again button when the search fails
	 */
	"try-again": string;

	/**
	 * Text on the visually hidden submit search button
	 */
	"submit-search": string;

	/**
	 * `title` attribute on the group title total number
	 */
	"total-search-results-in-group": string;

	/**
	 * Aria label on the search highlight link with scroll anchor. Used on the `title` attribute as well.
	 */
	"aria-label-highlight-link": string;

	/**
	 *
	 * Announced search loading message when the Enter key is pressed on the search input
	 * when the search results are still loading.
	 */
	"aria-live-loading-results": string;

	/**
	 * Announced error when there is too few search terms when the Enter key is pressed
	 * on the search input.
	 */
	"aria-live-too-few-search-terms": string;

	/**
	 * Announced search results total when the Enter key is pressed on the search input
	 * on a single group view.
	 */
	"aria-live-total-results": string;

	/**
	 * Announced search results details about the groups ands hits when
	 * the Enter key is pressed on the search input on multiple group search view.
	 */
	"aria-live-group-result-details": string;

	/**
	 * Announced tip for focusing the first search result with Shift+Enter
	 */
	"aria-live-focus-search-results-with-shift-enter": string;

	/**
	 * Aria label for the <form role="search"> landmark
	 */
	"aria-label-search-form": string;

	/**
	 * Aria label for the search controls section landmark
	 * containing the search input,search button and the close button.
	 */
	"aria-label-search-controls": string;

	/**
	 * Aria label on the <nav> landmark which contains "ShowAllLink"
	 */
	"aria-label-search-group-nav": string;

	/**
	 * Aria label on the highlights component
	 */
	"aria-label-highlights": string;

	/**
	 * Aria label on the Hit URL
	 */
	"aria-label-hit-url": string;

	/**
	 * Aria label on the Hit group element
	 */
	"aria-label-hit": string;

	/**
	 * Aria label for the group section landmark on the multiple group search view
	 */
	"aria-label-group-hit-total": string;

	/**
	 * Title for the message box from the server which shows the
	 * "Powered by Findkit" for free plans
	 */
	"aria-label-findkit-messages": string;

	/**
	 * Visually hidden heading for the search results when only single group is used
	 */
	"single-search-results-heading": string;

	/**
	 * Announced message on group navigation on the search results heading
	 * when multiple groups are shown. Visually hidden.
	 */
	"aria-live-group-navigation-search-multiple-groups": string;

	/**
	 * Announced message on group navigation on the search results heading
	 * when a single gropu is selected. Visually hidden.
	 */
	"aria-live-group-navigation-search-selected-group": string;
}

export const BASE_TRANSLATIONS: TranslationStrings = {
	close: "Close",
	"show-all": "Show more search results",
	"aria-show-all": "Show all search {{total}} results in the group {{group}}",
	"all-results-shown": "All results shown",
	"load-more": "Load more",
	"go-back": "Back",
	"aria-label-close-search": "Close search",
	"aria-label-search-input": "Search input",
	"no-results": "No results",
	"sr-search-instructions":
		"Search shows search results automatically as you type. Search results can be browsed with tabulator.",
	"sr-search-instructions-modal": "Exit search with escape key.",
	"superwords-match": "Pinned search result",
	"error-title": "Unexpected error",
	"try-again": "Try again",
	"total-search-results-in-group": "Total results in the group",
	"submit-search": "Submit Search",
	"aria-label-highlight-link": 'Highlight page content around "{{words}}"',
	"aria-live-loading-results": "Loading search results...",
	"aria-live-too-few-search-terms":
		"Too few search terms. Minimum {{minTerms}} characters.",
	"aria-live-focus-search-results-with-shift-enter":
		"Focus first result with shift enter",
	"aria-live-total-results": "{{total}} results found.",
	"aria-live-group-result-details":
		"{{allTotal}} results found in {{groupCount}} groups.",
	"aria-label-search-form": "Search form",
	"aria-label-search-controls": "Search controls",
	"aria-label-search-group-nav": "Search group",
	"aria-label-highlights": "Search hit highlights",
	"aria-label-hit-url": "Search hit URL: {{href}}",
	"aria-label-hit": "Search result {{number}}",
	"aria-label-group-hit-total": "Search result group with {{total}} hits",
	"aria-label-findkit-messages": "Findkit messages",
	"single-search-results-heading": "Search results",
	"aria-live-group-navigation-search-selected-group":
		"Search results for the selected group",
	"aria-live-group-navigation-search-multiple-groups":
		"Search results for {{groupCount}} groups.",
};

export const TRANSLATIONS: Record<string, TranslationStrings> = {
	en: BASE_TRANSLATIONS,
	fi: {
		close: "Sulje",
		"go-back": "Takaisin",
		"show-all": "Näytä kaikki",
		"aria-show-all": "Näytä kaikki {{total}} hakutulosta ryhmässä {{group}}",
		"load-more": "Lataa lisää",
		"aria-label-close-search": "Sulje haku",
		"all-results-shown": "Kaikki tulokset näytetty",
		"aria-label-search-input": "Hakukenttä",
		"no-results": "Ei hakutuloksia",
		"sr-search-instructions":
			"Hakutoiminto esittää hakutulokset automaattisesti kirjoittaessasi hakusanaa. Hakutuloksia on mahdollista selata tab-näppäimellä.",
		"sr-search-instructions-modal": "Sulje haku esc-näppäimellä.",
		"superwords-match": "Nostettu hakutulos",
		"error-title": "Odottamaton virhe",
		"try-again": "Yritä uudelleen",
		"submit-search": "Lähetä haku",
		"total-search-results-in-group": "Hakutulosmäärä ryhmässä",
		"aria-label-highlight-link":
			'Korosta sivun sisältöä sanojen "{{words}}" ympärillä',
		"aria-live-loading-results": "Ladataan hakutuloksia...",
		"aria-live-too-few-search-terms":
			"Liian lyhyt hakusana. Vähintään {{minTerms}} merkkiä.",
		"aria-live-focus-search-results-with-shift-enter":
			"Kohdista ensimmäiseen tulokseen shift enterillä",
		"aria-live-total-results": "{{total}} tulosta löydetty.",
		"aria-live-group-result-details":
			"{{allTotal}} tulosta löydetty {{groupCount}} ryhmästä.",

		"aria-label-search-form": "Hakulomake",
		"aria-label-search-controls": "Hakutoiminnot",
		"aria-label-search-group-nav": "Hakuryhmä",
		"aria-label-highlights": "Hakutulosten osumien korostukset",
		"aria-label-hit-url": "Hakutuloksen URL: {{href}}",
		"aria-label-hit": "Hakutulos {{number}}",
		"aria-label-group-hit-total": "Hakutulosryhmä jossa on {{total}} osumaa",
		"aria-label-findkit-messages": "Findkit-viestit",

		"single-search-results-heading": "Haun tulokset",
		"aria-live-group-navigation-search-selected-group":
			"Hakutulokset {{groupCount}} ryhmälle.",
		"aria-live-group-navigation-search-multiple-groups":
			"Hakutulokset valitulle ryhmälle",
	},
};

export interface Translator {
	(
		key: keyof TranslationStrings,
		data?: Record<string, string | number>,
	): string;
}
