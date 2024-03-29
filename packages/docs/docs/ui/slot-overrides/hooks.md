# Hooks and Utils

Following utils can be imported from `@findkit/ui` for slot component usage.

Functions starting with the `use` keyword are
[Preact](https://preactjs.com/guide/v10/hooks/) hooks.

### `useParams()` {#useParams}

Slot override hook version of [`updateParams`](/ui/api/#updateParams).

Example

```ts
import { FindkitUI, html, useInput } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	slots: {
		Header(props) {
			const [params, setParams] = useParams();
			const checked = params.filter.tags === "crawler";

			return html`
				${props.children}
				<label>
					<input
						type="checkbox"
						checked=${checked}
						onChange=${() => {
							setParams((params) => {
								if (checked) {
									params.filter.tags = "crawler";
								} else {
									delete params.filter.tags;
								}
							});
						}}
					/>
					Limit results with tag "crawler"
				</label>
			`;
		},
	},
});
```

<Api page="ui.useparams" />

### `useGroups()` {#useGroups}

Slot override Hook version of [`updateGroups`](/ui/api/#updateGroups).

Example

```ts
const [groups, setGroups] = useGroups();

const onClick = () => {
	setGroups((group1, groups2 /* ...groups */) => {
		group1.title = "new title";
		group2.params.filter.tags = "crawler";
	});
};
```

<Api page="ui.usegroups" />

### `useTerms()` {#useTerms}

Return the search terms used for the current search results.

<Api page="ui.useterms" />

### `useInput()` {#useInput}

Hook for binding custom inputs as the search terms inputs. Usually used in the
[Header slot](/ui/slot-overrides/slots/#header) to override the default search
input with a fully custom one

```ts
import { FindkitUI, html, useInput } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	slots: {
		Header(props) {
			const ref = useInput();
			return html`<input type="text" ref=${ref} />`;
		},
	},
});
```

<Api page="ui.useinput" />

### `useTotalHitCount()` {#useTotalHitCount}

Return total hit count. Includes count from all groups if multiple groups are used.

<Api page="ui.usetotalhitcount" />

### `useLoading()` {#useLoading}

[Delayed loading event](/ui/api/events#loading) as a hook. Return true when a
network requet is taking longer than usual. Use to to implement custom loading
indicators in a slot overrides.

<Api page="ui.useLoading" />

### `useLang()` {#useLang}

Return the current UI language. Can be used to implement custom ui string
translations on slot overrides. See [`setLang`](/ui/api/#setLang).

<Api page="ui.uselanguage" />

### `useTranslate()` {#useTranslate}

_New in v0.19.0_

Get the translation function. Can render existing translations but it can also
render custom translations. See also [`addTranslation`](/ui/api/#addTranslation)

```ts
import { FindkitUI, useTranslate } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	slots: {
		Header(props) {
			const t = useTranslate();
			return html`${t("greet", { name: "Matt" })}`;
		},
	},
});

ui.addTranslation(
	"en",
	{}, // Override build-in translations
	{   // Custom translations
		greet: "Hello {{name}}!",
	},
);
```

When using Typescript the translation key is constrained to the internal keys.
Use type argument to widen it.

```ts
const t = useTranslate<"greet" | "another">();
```

<Api page="ui.useTranslate" />

### `useCustomRouterData()` {#useCustomRouterData}

_New in v0.16.0_

Preact Hook version of the
[`setCustomRouterData`](/ui/api/#setCustomRouterData) method. Works like
`useState` but the value must be a flat object of string values. Eg. `{[key:
string]: string}`

```ts
import { FindkitUI, html, useCustomRouterData, useParams } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	slots: {
		Header(props) {
			const [data, setData] = useCustomRouterData({ value: "yes" });
			const [params, setParams] = useParams();

			const onClick = () => {
				setData((data) => {
					if (data.value === "yes") {
						data.value = "no";
					} else {
						data.value = "yes";
					}
				});

				// Update search params
				updateParams(/* ... */);
			};

			return html`
				<button type="button" onClick=${onClick}>${data.value}</button>
			`;
		},
	},
});
```

<Api page="ui.useCustomRouterData" />

### `useResults()` {#useResults}

_New in v0.20.0_

Access the search results by [groups](ui/api/groups). Returns an array of <Api page="ui.GroupResults" >GroupResults</Api> objects. If you are not using groups just use the first item in the array: `const results = useResults()[0]`.


### `preact` {#preact}

Object of commonly used Preact Hooks. See the api docs for details.

<Api page="ui.preactfunctions" />

### `html` {#html}

Prebound HTM (Hyperscript Tagged Markup) tagged template. For more information see: <https://github.com/developit/htm>

<Api page="ui.html" />

### `h` {#h}

The Preact JSX pragma

<Api page="ui.h" />
