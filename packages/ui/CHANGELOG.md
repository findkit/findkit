## v0.14.0

2023-11-22

- Add Group slot
  - TODO docs link
- Add "Part Components" to slots props
  - TODO docs link
- Export HitSlotProps [8f22259](https://github.com/findkit/findkit/commit/8f22259) - Esa-Matti Suuronen
- Add `groupId to Hit slot [4de6e51](https://github.com/findkit/findkit/commit/4de6e51) - Esa-Matti Suuronen
- Add preact devtools bridge [f2483e2](https://github.com/findkit/findkit/commit/f2483e2) - Esa-Matti Suuronen
- Infer generics from constructor options too [9bc3136](https://github.com/findkit/findkit/commit/9bc3136) - Esa-Matti Suuronen
- BREAKING: Replace SearchInputIcon with icon prop in Header SearchInput part [009244b](https://github.com/findkit/findkit/commit/009244b) - Esa-Matti Suuronen
  - If used the SearchInputIcon slot
  - Not likely

All changes https://github.com/findkit/findkit/compare/ui/v0.13.0...ui/v0.14.0

## v0.13.0

2023-11-16

- Use [CSS Layers](https://docs.findkit.com/ui/styling#css-layers) in build-in styles [901cb43](https://github.com/findkit/findkit/commit/901cb43) - Esa-Matti Suuronen
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
- Upgrade build-in preact [57cdb08](https://github.com/findkit/findkit/commit/57cdb08) - Esa-Matti Suuronen
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
