# Technical Description

The `@findki/ui` library is implemented using Preact which is bundled inside the
library. This makes it very easy to use the library because users do not have
known anything about Preact since it is just an implementation detail (unless
using Slot Override Components).

## Lazy Loading from our CDN

Although Preact footprint is very small it can cause web performance budget
concerns but Findkit UI solves this by lazy loading the implementation just in
time from our CDN when the user starts to interact with UI. This is true for the module script import
and for the npm package import. Meaning even the npm package loads the actual
implementation from our CDN. [This can be disabled](/ui/advanced/disable-cdn) if
you cannot depend on our CDN.

## Rendering

By default the UI renders a full screen modal into a dynamically created
container with Shadow DOM and focus trapping. This ensures that UI can be opened
on any page without having to worry that the page styles can interfere with it.
This is of course customizable. You can disable the shadow dom and render the UI
in a [custom container](/ui/api/#container) without the modal.

## Routing

The current search terms are saved in the query string using the browser History
API. This ensures that the search results are restored when user presses the
browser back button from a result page. Sometimes this routing method can
conflict the used framework and it [can be disabled or completely
customized](/ui/advanced/routing).

## Fetching

The UI library uses the `@findkit/fetch` module internally to make the search
requests. This is public library that can be used directly as well when the UI
library is too high level. It is a small wrapper around the Fetch API but it provides
TypeScript types, JWT authentication and CORs support out of the box.

## Source Code

The source code is written in TypeScript and React but compiled to JavaScript
and Preact when published to npm and the CDN. The code and contributing documentation
is available here: <https://github.com/findkit/findkit/tree/main/packages/ui>
