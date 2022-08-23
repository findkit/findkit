export const BASE_TRANSLATIONS = {
	close: "Close",
	total: "Total",
};

export type TranslationStrings = typeof BASE_TRANSLATIONS;

export const TRANSLATIONS: Record<string, TranslationStrings> = {
	en: BASE_TRANSLATIONS,
	fi: {
		close: "Sulje",
		total: "Yhteensä",
	},
};

export interface Translator {
	(key: keyof TranslationStrings): string;
}

export function createTranslator(
	lang: string,
	extra?: Partial<TranslationStrings>
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
