export const BASE_TRANSLATIONS = {
	close: "Close",
	"show-all": "Show more search results",
	"all-results-shown": "All results shown",
	"load-more": "Load more",
	"go-back": "Back",
	"aria-label-close-search": "Close search",
	"aria-label-search-input": "Search input",
};

/**
 * @public
 *
 * Available translations strings
 *
 */
export type TranslationStrings = typeof BASE_TRANSLATIONS;

export const TRANSLATIONS: Record<string, TranslationStrings> = {
	en: BASE_TRANSLATIONS,
	fi: {
		close: "Sulje",
		"go-back": "Takaisin",
		"show-all": "Näytä kaikki",
		"load-more": "Lataa lisää",
		"aria-label-close-search": "Sulje haku",
		"all-results-shown": "Kaikki tulokset näytetty",
		"aria-label-search-input": "Hakukenttä",
	},
};

export interface Translator {
	(key: keyof TranslationStrings): string;
}

export function createTranslator(
	lang: string,
	extra?: Partial<TranslationStrings>,
): Translator {
	const translations = {
		...BASE_TRANSLATIONS,
		...TRANSLATIONS[lang],
		...extra,
	};

	return (key) => {
		return translations[key] ?? `[${key} not translated]`;
	};
}
