# WordPress Abilities

The plugin registers its PHP API as [WordPress
Abilities](https://developer.wordpress.org/apis/abilities-api/). Abilities are a
machine readable description of what a plugin can do: each one carries a JSON
Schema for its input and output and a permission check, which lets AI agents,
WP-CLI and other tools discover and call them without knowing anything about
Findkit.

Requires WordPress 6.9, where the Abilities API ships in core. On older versions
the abilities are simply absent and the [global
functions](/wordpress-plugin/#functions) keep working as before.

All abilities are registered in the `findkit` category.

## Abilities

| Ability                                   | Capability       | Notes       |
| ----------------------------------------- | ---------------- | ----------- |
| [`findkit/search`](#search)               | `read`           | read only   |
| [`findkit/get-page-meta`](#get-page-meta) | `read`           | read only   |
| [`findkit/link-report`](#link-report)     | `manage_options` | read only   |
| [`findkit/full-crawl`](#full-crawl)       | `manage_options` |             |
| [`findkit/partial-crawl`](#partial-crawl) | `manage_options` |             |
| [`findkit/manual-crawl`](#manual-crawl)   | `manage_options` |             |
| [`findkit/delete-pages`](#delete-pages)   | `manage_options` | destructive |

The two `read` abilities only expose content a visitor could already see. The
rest spend the Findkit API key or change the search index, so they require
`manage_options`.

### `findkit/search` {#search}

Search site content from the Findkit search index. Wraps
[`findkit_search()`](/wordpress-plugin/#findkit_search).

Input

- `terms: string` **required**. Search terms.
- `search_params: object`. Optional [search
  params](https://docs.findkit.com/ui-api/ui.searchparams/).

Returns `{ success: boolean, results: object }`.

### `findkit/get-page-meta` {#get-page-meta}

Get the Findkit Page Meta of a post, which is the data the crawler indexes for
it. Wraps
[`findkit_get_page_meta()`](/wordpress-plugin/#findkit_get_page_meta).

Input

- `post_id: integer` **required**.

Non-public posts are visible only to users who can read the post itself. A post
the user may not read returns the same error as a missing post, so the ability
cannot be used to discover which post ids exist.

### `findkit/link-report` {#link-report}

List the links on the site which point at pages that are missing, forbidden,
failing or redirected. Built from data collected during the crawl, so it sends
no requests to the site. Wraps
[`findkit_get_link_report()`](/wordpress-plugin/#findkit_get_link_report).

Requires [`track_links = "all"`](/toml/options#track_links) on the crawler
target, which is a Pro plan feature. Without it only pdf links are tracked and
the report is nearly empty — check `targets[].link_tracking` in the response to
tell that apart from a site with no broken links.

Input

- `target: string`. Limit the report to a single crawler target host.
- `limit: integer`. How many links to return, 1 to 5000. Defaults to 1000.
- `refresh: boolean`. Read from the API instead of the local cache. The result
  is cached for 15 minutes, because it only changes when the site is crawled.

Returns

- `summary: object`. Count per reason: `not_found`, `forbidden`,
  `server_error`, `redirect`, `unknown`.
- `links: array`. One entry per problem link with `page`, `link`,
  `http_status`, `reason`, `message` and `redirects_to`.
- `targets: array`. `host`, `link_tracking` and `walk_links` per crawler
  target.
- `truncated: boolean`. True when there were more problem links than the limit.
- `last_full_crawl: string|null`. When the full crawl behind the report
  finished, as an ISO timestamp.

:::note
`last_full_crawl` reports the last completed **full** crawl, not the most
recent crawl of any kind. A full crawl clears the redirected and skipped urls
when it starts, so it decides what the report contains, and a newer single url
manual crawl would date the findings wrongly.
:::

<details>
<summary>Example response</summary>

```php
[
	'summary' => [
		'not_found' => 2,
		'forbidden' => 0,
		'server_error' => 0,
		'redirect' => 1,
		'unknown' => 0,
	],
	'links' => [
		[
			'page' => 'https://example.com/about/',
			'link' => 'https://example.com/removed-page/',
			'http_status' => 404,
			'reason' => 'not_found',
			'message' => 'Gone',
			'redirects_to' => null,
		],
		[
			'page' => 'https://example.com/about/',
			'link' => 'https://example.com/old-url/',
			'http_status' => 301,
			'reason' => 'redirect',
			'message' => 'Redirect(http) to https://example.com/new-url/',
			'redirects_to' => 'https://example.com/new-url/',
		],
	],
	'targets' => [
		[
			'host' => 'example.com',
			'link_tracking' => 'all',
			'walk_links' => true,
		],
	],
	'truncated' => false,
	'last_full_crawl' => '2026-09-01T10:00:00.000Z',
]
```

</details>

### `findkit/full-crawl` {#full-crawl}

Start a [full crawl](/crawler/running-crawls#full). Takes no input.

### `findkit/partial-crawl` {#partial-crawl}

Start a [partial crawl](/crawler/running-crawls#partial). Takes no input.

### `findkit/manual-crawl` {#manual-crawl}

Crawl the given urls. Wraps
[`findkit_manual_crawl()`](/wordpress-plugin/#findkit_manual_crawl).

Input

- `urls: string[]` **required**. Full urls of pages on this site.

### `findkit/delete-pages` {#delete-pages}

Delete pages from the search index by their exact urls, without crawling them.
Annotated as destructive.

Input

- `urls: string[]` **required**, at most 50. Full urls of pages on this site.

## Calling an ability

From PHP:

```php
$result = wp_get_ability( 'findkit/search' )->execute( [ 'terms' => 'hello' ] );

if ( is_wp_error( $result ) ) {
	// permission denied, invalid input or a Findkit API error
}
```

Note that `execute()` runs the permission check against the **current user**. In
WP-CLI or cron there is no current user, so the call fails with
`ability_invalid_permissions` unless a user is set with
`wp_set_current_user()`.

Over the REST API:

```
POST /wp-json/wp-abilities/v1/abilities/findkit%2Fsearch/run
GET  /wp-json/wp-abilities/v1/abilities/findkit%2Fsearch
GET  /wp-json/wp-abilities/v1/abilities
```

The ability name contains a slash, so it must be url encoded in the path.

## Permissions

The permission check lives in the ability. The
[`findkit_*()`](/wordpress-plugin/#functions) functions the abilities wrap do
**not** check capabilities, because they are the plugin's PHP API and are also
the only interface on WordPress versions without the Abilities API.

Two consequences worth knowing when integrating:

- Prefer the ability when a user is involved. It enforces the capability and
  validates the input against the schema.
- If you call a `findkit_*()` function directly, do your own
  `current_user_can()` check. In particular, do not fall back from an ability
  to the matching function when the ability returns
  `ability_invalid_permissions` — that turns a refusal into a bypass.
