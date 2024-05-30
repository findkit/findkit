## v1.3.0

2024-05-30

-   Add [`ui.usedTerms`](https://docs.findkit.com/ui/api/#usedTerms-prop) alias for `.terms`,  deprecate it and remove from docs
-   Add [`ui.nextTerms`](https://docs.findkit.com/ui/api/#nextTerms-prop) [37cfa3f](https://github.com/findkit/findkit/commit/37cfa3f) - Esa-Matti Suuronen
-   Fix .terms to be getter as it was documented [85d6ea7](https://github.com/findkit/findkit/commit/85d6ea7) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v1.2.0...ui/v1.3.0

## v1.2.0

2024-05-22

- Add ui.customRouterData getter [0c65302](https://github.com/findkit/findkit/commit/0c65302) - Esa-Matti Suuronen
- Add loaded prop [a80bc63](https://github.com/findkit/findkit/commit/a80bc63) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v1.1.0...ui/v1.2.0

## v1.1.0

2024-05-15

- Add [`operator`](https://docs.findkit.com/ui/api/params#operator) search param for configuring how the search terms are required to appear in a page.
- Add experimental support for semantic search. In private testing. If you are interested in trying it out early, [contact us](https://www.findkit.com/contact/)!

All changes https://github.com/findkit/findkit/compare/ui/v1.0.3...ui/v1.1.0

## v1.0.3

2024-04-11

- Fix hit focus restoring with bfcache [ff0c600](https://github.com/findkit/findkit/commit/ff0c600) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v1.0.2...ui/v1.0.3

## v1.0.2

2024-04-10

- Do not make .findkit--host inert ever [dae2bd0](https://github.com/findkit/findkit/commit/dae2bd0) - Esa-Matti Suuronen
- Fix screen reader annoucements with an external input [b6fd8ce](https://github.com/findkit/findkit/commit/b6fd8ce) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v1.0.1...ui/v1.0.2

## v1.0.1

2024-04-09

- Fix focus restoring with custom container [de3c194](https://github.com/findkit/findkit/commit/de3c194) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v1.0.0...ui/v1.0.1

## v1.0.0

2024-04-09

Read the [announcement blog post](https://www.findkit.com/findkit-ui-v1-0-a-leap-in-accessibility/) as well

- Wrap modal in `<dialog>` with `.showModal()` for proper screen reader trapping
- Remove `.trapFocus()` replace it with [`inert`](https://docs.findkit.com/ui/api/#inert) option for setting elements as inert when the modal is open
  - BREAKING: If you use the the method
  - BREAKING: If you use [offset](https://docs.findkit.com/ui/patterns/embedding/offset/) or [overlay modal](https://docs.findkit.com/ui/patterns/embedding/content-overlay) patterns. You need to add `inert` option to allow focus outside the modal
- Use semantic elements for landmarks
  - BREAKING: Possibly if you have lot of custom css since this changes the DOM structure
- Use `type=search` for the search input
- Read results counts on form submit with aria-live
- Announce multi group navigations with aria-live=polite
- Focus the search hit when returning to the search using the back button
- Focus first search hit using shift+enter when a search input is focused
- Add `lang` attributes to search hits to ensure they are read with the correct speech synth
- Turn `<em>` highlights into clickable links
  - the `<em>`s are converted to `<a>`
  - BREAKING: If you styled the `<em>` element elements using `em` selector
    - Switch to `.findkit--em` class selector
- Add [`separator`](https://docs.findkit.com/ui/api/#separator) option for defining the query string separator
  - eg. the `_` in `fdk_q`
- Use `_` as the default separator for custom router fields used to be `.`
  - This was a bad default since WordPress does not allow dots in query string keys. It converts them to underscores using a redirect.
  - BREAKING: If you have manually added custom router links with dots somewhere
- Do not emit hit-click events for external links in Hit slots [154effb](https://github.com/findkit/findkit/commit/154effb)
- Consistently use instance id based body class with the modal [161edf3](https://github.com/findkit/findkit/commit/161edf3)
- remove deprecated ui option [dffff7e](https://github.com/findkit/findkit/commit/dffff7e) - Esa-Matti Suuronen
- Add visually hidden submit button for screen readers next to the search input

All changes https://github.com/findkit/findkit/compare/ui/v0.22.0...ui/v1.0.0

## v0.22.0

2024-02-23

- Support regions in public tokens
- Send warm up request along with the implementation preload request
  to speed up the initial search request

All changes https://github.com/findkit/findkit/compare/ui/v0.21.0...ui/v0.22.0

## v0.21.0

2024-02-20

- Add [`builtinStyles`](https://docs.findkit.com/ui/api/#builtinStyles) option [8fa01b7](https://github.com/findkit/findkit/commit/8fa01b7) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.20.0...ui/v0.21.0

## v0.20.0

2024-01-29

- Add [`.activateGroup()`](https://docs.findkit.com/ui/api/#activateGroup) and [`.clearGroup()`](https://docs.findkit.com/ui/api/#clearGroup) methods to the UI instance.
- Add [`useResults()`](https://docs.findkit.com/ui/slot-overrides/hooks#useResults)

All changes https://github.com/findkit/findkit/compare/ui/v0.19.2...ui/v0.20.0

## v0.19.2

2024-01-23

- Fix crash caused by hit slot created and modified dates when returnining to search results view with browser back - Joonas Varis

All changes https://github.com/findkit/findkit/compare/ui/v0.19.1...ui/v0.19.2

## v0.19.1

2024-01-11

- Revert layout shifting fix [4bc3e3d](https://github.com/findkit/findkit/commit/4bc3e3d) - Esa-Matti Suuronen
  - Causes visual issues on many sites so it cannot be built-in. Implement it manually with the `open` event:

```ts
ui.on("open", () => {
	const scrollbarWidth =
		window.innerWidth - document.documentElement.clientWidth;
	document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
	ui.once("close", () => {
		document.documentElement.style.paddingRight = "";
	});
});
```

All changes https://github.com/findkit/findkit/compare/ui/v0.19.0...ui/v0.19.1

## v0.19.0

2024-01-10

- Emit open after dom mount [2c69da5](https://github.com/findkit/findkit/commit/2c69da5) - Esa-Matti Suuronen
- Avoid layout shift when the page scrollbar is hidden on modal open [f87053d](https://github.com/findkit/findkit/commit/f87053d) - Esa-Matti Suuronen
- Prevent layout shifting when modal scrollbar appears [e86ce6a](https://github.com/findkit/findkit/commit/e86ce6a) - Esa-Matti Suuronen
- Expose useTranslate hook [aae262a](https://github.com/findkit/findkit/commit/aae262a) - Esa-Matti Suuronen
  - https://docs.findkit.com/ui/slot-overrides/hooks#useTranslate
- Add Results slot [a48f95d](https://github.com/findkit/findkit/commit/a48f95d) - Esa-Matti Suuronen
  - https://docs.findkit.com/ui/slot-overrides/slots#results
- Remove all devtools, makes things slow [d520e3b](https://github.com/findkit/findkit/commit/d520e3b) - Esa-Matti Suuronen
- Wrap group title into span [da243af](https://github.com/findkit/findkit/commit/da243af) - Esa-Matti Suuronen
- Fix groups not updating on "lang" event with less than required terms [eadc48e](https://github.com/findkit/findkit/commit/eadc48e) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.18.2...ui/v0.19.0

## v0.18.2

2023-12-21

- Fix modal bottom offset when using css 'top' for the modal container [6dfef1a](https://github.com/findkit/findkit/commit/6dfef1a) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.18.1...ui/v0.18.2

## v0.18.1

2023-12-20

- Revert focus trapping on .openFrom() [255ee20](https://github.com/findkit/findkit/commit/255ee20) - Esa-Matti Suuronen
  - Which was added in v0.18.0. Mistake. On fullscreen modal the element is hidden and should not be focusable
  - Use explicit .trapFocus() call when the element is visible

All changes https://github.com/findkit/findkit/compare/ui/v0.18.0...ui/v0.18.1

## v0.18.0

2023-12-19

- Add [toggle()](https://docs.findkit.com/ui/api/#toggle) method
- Add openFrom elements to focus trap [4f23ec6](https://github.com/findkit/findkit/commit/4f23ec6) - Esa-Matti Suuronen
- closes the modal when a 'openFrom' button is clicked again
- Add [backdrop](https://docs.findkit.com/ui/api/#backdrop) option [0c39e43](https://github.com/findkit/findkit/commit/0c39e43) - Esa-Matti Suuronen
- Add [closeOnOutsideClick](https://docs.findkit.com/ui/api/#closeOnOutsideClick) [16149a6](https://github.com/findkit/findkit/commit/16149a6) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.17.0...ui/v0.18.0

## v0.17.0

2023-12-14

- Handle data-clicked in [.openFrom()](https://docs.findkit.com/ui/api/#openFrom)
- Add ui.search(terms)
- Emit [`findkituievent` DOM events](https://docs.findkit.com/ui/api/events#dom-events) from the built-in events
- Allow constructor options mutation in the [`init` event](https://docs.findkit.com/ui/api/events#init)

All changes https://github.com/findkit/findkit/compare/ui/v0.16.0...ui/v0.17.0

## v0.16.0

2023-11-30

- Add [useCustomRouterData](https://docs.findkit.com/ui/slot-overrides/hooks#useCustomRouterData)

All changes https://github.com/findkit/findkit/compare/ui/v0.15.0...ui/v0.16.0

## v0.15.0

2023-11-23

- Add [skip search param](https://docs.findkit.com/ui/api/params#skip) [953f9d4](https://github.com/findkit/findkit/commit/953f9d4) - Esa-Matti Suuronen
- Regression fix: Hide group title element when there is no title [ddd355b](https://github.com/findkit/findkit/commit/ddd355b) - Esa-Matti Suuronen
- Hide group completely when it has no children [0b265c2](https://github.com/findkit/findkit/commit/0b265c2) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.14.0...ui/v0.15.0

## v0.14.0

2023-11-22

- Add [Group slot](https://docs.findkit.com/ui/slot-overrides/slots#group)
- Add "Part Components" to slots props
- Export HitSlotProps [8f22259](https://github.com/findkit/findkit/commit/8f22259) - Esa-Matti Suuronen
- Add `groupId to Hit slot [4de6e51](https://github.com/findkit/findkit/commit/4de6e51) - Esa-Matti Suuronen
- Add preact devtools bridge [f2483e2](https://github.com/findkit/findkit/commit/f2483e2) - Esa-Matti Suuronen
  - You may now inspect Findkit UI with [Preact Devtools](https://preactjs.github.io/preact-devtools/)
- Infer generics from constructor options too [9bc3136](https://github.com/findkit/findkit/commit/9bc3136) - Esa-Matti Suuronen
- BREAKING: Replace SearchInputIcon with icon prop in Header SearchInput part [009244b](https://github.com/findkit/findkit/commit/009244b) - Esa-Matti Suuronen
  - If used the SearchInputIcon slot
  - Not likely

All changes https://github.com/findkit/findkit/compare/ui/v0.13.0...ui/v0.14.0

## v0.13.0

2023-11-16

- Use [CSS Layers](https://docs.findkit.com/ui/styling#css-layers) in built-in styles [901cb43](https://github.com/findkit/findkit/commit/901cb43) - Esa-Matti Suuronen
  - Possibly BREAKING if using `shadowDom: false`
  - Set [`cssLayers: false`](https://docs.findkit.com/ui/api/#cssLayers) if you see issues with CSS
- Allow transient search params and terms update during fetch event [6417aaf](https://github.com/findkit/findkit/commit/6417aaf) - Esa-Matti Suuronen
  - Add `event.transientUpdateParams()` and `event.transientUpdateGroups()` methods to the [`fetch`](https://docs.findkit.com/ui/api/events/#fetch) event object
- Add [`loading`](https://docs.findkit.com/ui/api/events/#loading) and [`loading-done`](https://docs.findkit.com/ui/api/events/#loading) events [892b8fc](https://github.com/findkit/findkit/commit/892b8fc) for easy loading indicator implementing - Esa-Matti Suuronen
- Add [useLoading()](https://docs.findkit.com/ui/slot-overrides/hooks#useLoading) hook and dog food the "loading" event [b3cd452](https://github.com/findkit/findkit/commit/b3cd452) - Esa-Matti Suuronen
- Fix lazy loading when loading the same version from different bundles [b7e9022](https://github.com/findkit/findkit/commit/b7e9022) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.12.1...ui/v0.13.0

## v0.12.1

2023-11-07

- Fix enter key in .openFrom for role=button element [c50d304](https://github.com/findkit/findkit/commit/c50d304) - Esa-Matti Suuronen
- Close the modal on backdrop click [55da4c8](https://github.com/findkit/findkit/commit/55da4c8) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.12.0...ui/v0.12.1

## v0.12.0

2023-11-06

- Restore scroll positions when navigating inside FindkitUI in multi group mode
- Restore scroll position when coming back to the UI when Back/forward cache is not active
- Add [manageScroll option](https://docs.findkit.com/ui/api/#manageScroll)
- Add [forceHistoryReplace option](https://docs.findkit.com/ui/api/#forceHistoryReplace)
- Fully preload css to avoid flash of unstyled content [b893067](https://github.com/findkit/findkit/commit/b893067) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.10.1...ui/v0.12.0

## v0.10.1

2023-10-30

- Fix implementation loading with a custom container [124bdb0](https://github.com/findkit/findkit/commit/124bdb0) - Esa-Matti Suuronen
  - Regression fix from v0.10.0

All changes https://github.com/findkit/findkit/compare/ui/v0.10.0...ui/v0.10.1

## v0.10.0

2023-10-30

- Automatically set `modal: false` when using custom container [6c1b731](https://github.com/findkit/findkit/commit/6c1b731) - Esa-Matti Suuronen
  - BREAKING: If using the [Content Overlay pattern](https://docs.findkit.com/ui/patterns/embedding/content-overlay)
  - Must add explicit `modal: true`
- Fix input clearing when loading page with predefined search terms [7c10602](https://github.com/findkit/findkit/commit/7c10602) - Esa-Matti Suuronen
- Do not push to history when using a container element [f4d4824](https://github.com/findkit/findkit/commit/f4d4824) - Esa-Matti Suuronen
  - Fixes back button when using custom container

All changes https://github.com/findkit/findkit/compare/ui/v0.9.0...ui/v0.10.0

## v0.9.0

2023-10-25

- Add [field filtering support](https://docs.findkit.com/ui/filtering/) for `created`, `modified`, `language`, `tags` and any custom fields
- Add [sort search param](https://docs.findkit.com/ui/api/params#sort)
- Add support for [custom router data](https://docs.findkit.com/ui/custom-router-data)
- Add [fetchThrottle option](https://docs.findkit.com/ui/api/#fetchThrottle)
- Implement ts generics for .params and .updateParams [a76132a](https://github.com/findkit/findkit/commit/a76132a) - Esa-Matti Suuronen
- Use leading throttle for [`updateParams`](https://docs.findkit.com/ui/api/#updateParams) and `updateGroups`
- Tons of bug fixes

All changes https://github.com/findkit/findkit/compare/ui/v0.8.0...ui/v0.9.0

## v0.8.0

2023-10-17

- Fix leaking form styles when not using shadow dom [c2a4db4](https://github.com/findkit/findkit/commit/c2a4db4) - Esa-Matti Suuronen
- Upgrade built-in preact [57cdb08](https://github.com/findkit/findkit/commit/57cdb08) - Esa-Matti Suuronen
- Add language type to SearchResultHit [22014a8](https://github.com/findkit/findkit/commit/22014a8) - Esa-Matti Suuronen
- Remove proxy tracking from the hit objects [4d57c93](https://github.com/findkit/findkit/commit/4d57c93) - Esa-Matti Suuronen
- Ensure no side scrolling on small screens [412aa2d](https://github.com/findkit/findkit/commit/412aa2d) - Esa-Matti Suuronen
- Add [bind-input](https://docs.findkit.com/ui/api/events#bind-input) and [unbind-input](https://docs.findkit.com/ui/api/events#unbind-input) events [732c0b1](https://github.com/findkit/findkit/commit/732c0b1) - Esa-Matti Suuronen
- Add `append: boolean` to fetch-done event [095be11](https://github.com/findkit/findkit/commit/095be11) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.7.0...ui/v0.8.0

## v0.7.0

2023-10-06

- Add error boundaries to slot overrides [db119c8](https://github.com/findkit/findkit/commit/db119c8) - Esa-Matti Suuronen
  - If a custom slot override errors it won't bring down to whole search UI. Only the specific slot.
- Derive button hover background from `--brand-color` [1c7ed5c](https://github.com/findkit/findkit/commit/1c7ed5c) - Esa-Matti Suuronen
  - `--hover-bg-color` is now gone. If you need to set custom bg hover color use `.findkit--hover-bg { background-color: mycolor }`
- Inherit font-family for form controls (button, input etc) [a93b1ab](https://github.com/findkit/findkit/commit/a93b1ab) - Esa-Matti Suuronen
- Hide findkit branding by default from the search input icon [47568bb](https://github.com/findkit/findkit/commit/47568bb) - Esa-Matti Suuronen
  - Removes the lightning from the magnifying glass icon. If you want it back add `.findkit--magnifying-glass-lightning { visibility: visible }`
- Add [SearchInputIcon slot](https://docs.findkit.com/ui/slot-overrides/slots#searchinputicon) [1e83692](https://github.com/findkit/findkit/commit/1e83692) - Esa-Matti Suuronen
- Unify error component and add error translations [d824a84](https://github.com/findkit/findkit/commit/d824a84) - Esa-Matti Suuronen
- Fix retry button shown on fetch error [7fcbdae](https://github.com/findkit/findkit/commit/7fcbdae) - Esa-Matti Suuronen
- Add children type to [Hit slot props](https://docs.findkit.com/ui-api/ui.slots.hit/) [a94ecb5](https://github.com/findkit/findkit/commit/a94ecb5) - Esa-Matti Suuronen
- Stop spinner on fetch errors [2ac10d5](https://github.com/findkit/findkit/commit/2ac10d5) - Esa-Matti Suuronen
- Fix params.size [2105213](https://github.com/findkit/findkit/commit/2105213) - Esa-Matti Suuronen
- Consider http: and **force_findkit_dev** query string as dev mode [38eaf6e](https://github.com/findkit/findkit/commit/38eaf6e) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.6.1...ui/v0.7.0

## v0.6.1

2023-09-28

- Simpler tooltip for superword star [2525d6f](https://github.com/valu-digital/findkit-oss/commit/2525d6f) - Esa-Matti Suuronen

All changes https://github.com/valu-digital/findkit-oss/compare/ui/v0.6.0...ui/v0.6.1

## v0.6.0

2023-09-25

- Add star icon and `findkit--superwords-match` class to [superword matches](https://docs.findkit.com/crawler/meta-tag#superwords) in hits [8970f65](https://github.com/findkit/findkit/commit/8970f65) - Esa-Matti Suuronen

<img width="816" alt="image" src="https://github.com/findkit/findkit/assets/225712/8d1ae859-bf01-4dd7-98a3-2d89d42fec1d">

All changes https://github.com/findkit/findkit/compare/ui/v0.5.1...ui/v0.6.0

## v0.5.1

2023-09-11

- Add horizontal test snapshots [248a4e9](https://github.com/findkit/findkit/commit/248a4e9) - Esa-Matti Suuronen
  - Example <https://codesandbox.io/s/findkit-horizontal-nkdnl7?file=/index.html>
- Add `findkit--view-groups` and `findkit--view-single` classes [d36feb9](https://github.com/findkit/findkit/commit/d36feb9) - Esa-Matti Suuronen
- Export LanguageChangeEvent [9d2dcfc](https://github.com/findkit/findkit/commit/9d2dcfc) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.5.0...ui/v0.5.1

## v0.5.0

2023-08-25

- Deprecrate `ui` constructor option and add top-level [`lang`](https://docs.findkit.com/ui/api/#lang) and [`translations`](https://docs.findkit.com/ui/api/#translations) options
- Add [`monitorDocumentLang`](https://docs.findkit.com/ui/api/#monitorDocumentLang) option
- Add [`useLang`](https://docs.findkit.com/ui/slot-overrides/hooks#useLang) slot override hook
- Add [`lang`](https://docs.findkit.com/ui/api/events#lang) event
- Add [`setLang`](https://docs.findkit.com/ui/api/#setLang) method
- Add [`addTranslation`](https://docs.findkit.com/ui/api/#addTranslation) method
- Better instanceId error message [f333c83](https://github.com/findkit/findkit/commit/f333c83) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.4.0...ui/v0.5.0

## v0.4.0

2023-08-18

- Add tagBoost to FindkitUI [943f215](https://github.com/findkit/findkit/commit/943f215) - Esa-Matti Suuronen
  - https://docs.findkit.com/ui/api/params#tagBoost
- Expose hit score as a data attribute [9252c1b](https://github.com/findkit/findkit/commit/9252c1b) - Esa-Matti Suuronen
- Add links to SearchParams tsdoc [e5d0247](https://github.com/findkit/findkit/commit/e5d0247) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.3.0...ui/v0.4.0

## v0.3.0

2023-08-15

- Add total to fetch-done event [b1983c0](https://github.com/findkit/findkit/commit/b1983c0) - Joonas Varis
- Render search-endpoint messages [3b6f7da](https://github.com/findkit/findkit/commit/3b6f7da) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.2.4...ui/v0.3.0

## v0.2.4

2023-05-10

- Can use multiple instances [7ee2156](https://github.com/findkit/findkit/commit/7ee2156) - Esa-Matti Suuronen
- Cleanup callback name [ff5b2e0](https://github.com/findkit/findkit/commit/ff5b2e0) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.2.3...ui/v0.2.4

## v0.2.3

2023-03-01

- Detect loaded script using global callback [af9e0af](https://github.com/findkit/findkit/commit/af9e0af) - Esa-Matti Suuronen
  - Fixes rare edge case when the cdn implementation script did not load
- Export module format var [e627632](https://github.com/findkit/findkit/commit/e627632) - Esa-Matti Suuronen
- Fix esbuild error message [88bccab](https://github.com/findkit/findkit/commit/88bccab) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.2.2...ui/v0.2.3

## v0.2.2

2023-03-01

- Fix loading dead lock [e4a3e1b](https://github.com/findkit/findkit/commit/e4a3e1b) - Esa-Matti Suuronen
- Add console.error for bad configuration [98ccf5b](https://github.com/findkit/findkit/commit/98ccf5b) - Joonas Varis
- Fix group specific lang [97da192](https://github.com/findkit/findkit/commit/97da192) - Joonas Varis

All changes https://github.com/findkit/findkit/compare/ui/v0.2.1...ui/v0.2.2

## v0.2.1

2023-02-03

- Fix iOS unwantedly hiding the close button [8a97339](https://github.com/findkit/findkit/commit/8a97339) - Esa-Matti Suuronen
- Use rems for only font-sizes [9a5c6a3](https://github.com/findkit/findkit/commit/9a5c6a3) - Esa-Matti Suuronen
- Use relative local root in dev app [e317332](https://github.com/findkit/findkit/commit/e317332) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.2.0...ui/v0.2.1

## v0.2.0

2022-12-14

Add support for the JWT authentication with the [WordPress plugin](https://github.com/findkit/wp-findkit).

All changes https://github.com/findkit/findkit/compare/ui/v0.1.2...ui/v0.2.0

## v0.1.2

2022-11-04

- Add useTotalHitCount() hook [0775f0a](https://github.com/findkit/findkit/commit/0775f0a) - Esa-Matti Suuronen
- Fix Content slot with 'modal: false' [64ff4b6](https://github.com/findkit/findkit/commit/64ff4b6) - Esa-Matti Suuronen
- Fix Header slot with 'modal: false' [94e3c67](https://github.com/findkit/findkit/commit/94e3c67) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.1.1...ui/v0.1.2

## v0.1.1

2022-11-02

- Add esm exports to package.json [800747f](https://github.com/findkit/findkit/commit/800747f) - Esa-Matti Suuronen
- Upgrade npm tools [22a72bf](https://github.com/findkit/findkit/commit/22a72bf) - Esa-Matti Suuronen

All changes https://github.com/findkit/findkit/compare/ui/v0.1.0...ui/v0.1.1

## v0.1.0

2022-11-02

First "stable" release.
