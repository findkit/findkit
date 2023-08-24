# Translations

Findkit UI can work with multlingual webites. It automatically sets the UI
language translation based on the `<html lang>` attribute. It can be also
manually set using the [`setLanguage`](/ui/api/#setLanguage) method.
Currently Findkit UI comes with english and finnish translations but additional
languages can be added with [`addTranslation`](/ui/api/#addTranslation).

Example

```ts
const ui = new FindkitUI({ publicToken: "<TOKEN>" });

ui.addTranslation("fi-savo", {
	close: "Suluje",
	"go-back": "Takaste",
	"load-more": "Lattaappa lissaa",
	// See https://findk.it/strings for all available strings
});

ui.setLanguage("fi-savo");
```

The language will always fallback to the less spefic translations. For example
`fi-savo` will use the `fi-savo` translation added in the example but
`fi-rauma` will use the internal `fi` translation. If a completely unknown
language is provided Findkit UI will fallback to english. Also if a partial
translation is added it will fallback to english for non-translated strings.

## Single-page Apps

When building a multilingual Single-Page App (SPA), for example with Gatsby,
Next.js etc., where the page language changes without a page load when user
navigates to a page with different language, you might need to handle that
specifically depending on your situation.

If your framework automatically changes the `<html lang>` attribute on such
navigation then Findkit UI will automatically detect that and update the UI
strings accordingly. Otherwise you must call
[`setLanguage`](/ui/api/#setLanguage) explicitly on navigation.

### Language Based Search Params

A common pattern is to limit searches to the language of the current page by
passing a filter to [search params](/ui/api/#params) or
[groups](/ui/api/#groups) in the `FindkitUI` constructor. If you keep a single
instance of the FindkitUI between navigations the params can get stale when the
language changes. You must update them with
[`updateParams`](/ui/api/#updateParams) or with
[`updateGroups`](/ui/api/#updateGroups).

FindkitUI provides a [`language`](/ui/api/events#language) event which is
emitted when the language changes which can be used to dynamically set the
params.

```ts
const ui = new FindkitUI({ publicToken: "<TOKEN>" });

// Invoked on intial <html lang> read any later updates
ui.on("language", (e) => {
	const code = e.language.toLowerCase().slice(0, 2);

	ui.updateParams((params) => {
		params.tagQuery = [[`language/${code}`]];
	});
});
```
