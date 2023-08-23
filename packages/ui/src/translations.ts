/**
 * @public
 *
 * Available translations strings
 */
export interface TranslationStrings {
	close: string;
	"show-all": string;
	"aria-show-all": string;
	"all-results-shown": string;
	"load-more": string;
	"go-back": string;
	"aria-label-close-search": string;
	"aria-label-search-input": string;
	"no-results": string;
	"sr-result-count": string;
	"sr-search-instructions": string;
}

export const BASE_TRANSLATIONS: TranslationStrings = {
	close: "Close",
	"show-all": "Show more search results",
	"aria-show-all": "Show all search results in the group {{group}}",
	"all-results-shown": "All results shown",
	"load-more": "Load more",
	"go-back": "Back",
	"aria-label-close-search": "Close search",
	"aria-label-search-input": "Search input",
	"no-results": "No results",
	"sr-result-count": "Got {{count}} search results for terms {{terms}}",
	"sr-search-instructions":
		"Search shows search results automatically as you type. Search results can be browsed with tabulator. Search searches for results in different groups and displays group's search results from best to worst. Search opens to its own window which can be closed with the ESC key.",
};

function renderTranslation(
	msg: string,
	data?: Record<string, string | number>,
) {
	return msg.replace(/{{([^\}]+)}}/g, (_, key) => {
		return data?.[key]?.toString() ?? "[MISSING]";
	});
}

export const TRANSLATIONS: Record<string, TranslationStrings> = {
	en: BASE_TRANSLATIONS,
	fi: {
		close: "Sulje",
		"go-back": "Takaisin",
		"show-all": "Näytä kaikki",
		"aria-show-all": "Näytä kaikki hakutulokset ryhmässä {{group}}",
		"load-more": "Lataa lisää",
		"aria-label-close-search": "Sulje haku",
		"all-results-shown": "Kaikki tulokset näytetty",
		"aria-label-search-input": "Hakukenttä",
		"sr-result-count":
			"Hakutuloksia {{count}} kappaletta hakusanalla {{terms}}",
		"no-results": "Ei hakutuloksia",
		"sr-search-instructions":
			"Hakutoiminto esittää hakutulokset automaattisesti kirjoittaessasi hakusanaa. Hakutuloksia on mahdollista selata tab-näppäimellä. Haku etsii hakutuloksia useista ryhmistä, ja esittää ryhmän hakutulokset paremmuusjärjestyksessä. Haku aukeaa omaan näkymään, jonka käyttäjä voi sulkea esc-näppäimellä.",
	},
};

export interface Translator {
	(
		key: keyof TranslationStrings,
		data?: Record<string, string | number>,
	): string;
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

	return (key, data) => {
		if (translations[key]) {
			return renderTranslation(translations[key], data);
		}

		return `[${key} not translated]`;
	};
}
