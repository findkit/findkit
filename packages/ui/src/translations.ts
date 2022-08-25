export const BASE_TRANSLATIONS = {
	close: "Close",
	total: "Total",
	"show-all": "Show all",
	"load-more": "Load more",
	"aria-label-close-search": "Close search",
	"aria-label-search-input": "Search input",
};

/**
 * @public
 *
 * Avaialable translations strings
 *
 */
export type TranslationStrings = typeof BASE_TRANSLATIONS;

export const TRANSLATIONS: Record<string, TranslationStrings> = {
	en: BASE_TRANSLATIONS,
	fi: {
		close: "Sulje",
		total: "Yhteensä",
		"show-all": "Näytä kaikki",
		"load-more": "Lataa lisää",
		"aria-label-close-search": "Sulje haku",
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
