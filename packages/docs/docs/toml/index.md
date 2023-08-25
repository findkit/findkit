# findkit.toml

Findkit crawler and the search endpoint is configured using a `findkit.toml`
file which is authored in a [TOML format](https://toml.io/).

See [the example](/toml/example) for overview of how the file is structured.

## Top-Level Options

### `id: string` {#id}

The project identifier within the organization.

### `name: string` {#name}

Human readable name of project. Displayed in the Hub.

### `description: string` {#description}

Description of the project. Displayed in the Hub.

### `schedule_full_crawl: string` {#schedule_full_crawl}

Run the full crawl automatically with the given schedule.

Allowed values

- `weekly`
- `daily`
- `every-3-days`
- `every-2-days`

This is the same as running `findkit crawl start`. Read more from ["Starting
Crawls"](/crawler/starting#full).

### `schedule_partial_crawl: string` {#schedule_partial_crawl}

This is the same as running `findkit crawl start --partial`.
Read more from ["Starting Crawls"](/crawler/starting#partial).

Allowed values

- `weekly`
- `daily`
- `every-3-days`
- `every-2-days`

### `targets: object[]` {#targets}

List "targets" aka domain to crawl content from.

This is an array of tables. See the TOML spec on Arrays <https://toml.io/en/v1.0.0#array-of-tables>

## `[[targets]]` {#target-options}

Options for `[[targets]]` sections.

### `host: string` {#host}

Target host to crawl. Just a plain domain name without the `https://` prefix.


### `use_sitemap: boolean` {#use_sitemap}

Read the site sitemap.

Defaults to `true`.

### `walk_links: boolean` {#walk_links}

Find site pages by walking the links.

Disabled by default but automatically enabled if no sitemaps are found.
Fallback behaviour can be disabled by setting to `false`.

### `start_paths: string[]` {#start_paths}

List of pages where start link walking when [`walk_links`](#walk_links) is
enabled.

Defaults to `/`


### `content_selector: string` {#content_selector}

CSS selector used to select the text content for indexing.

Read more from the [Indexing Content](/crawler/indexing) page.

### `cleanup_selector: string` {#cleanup_selector}

CSS selector used to skip elements from indexing.

Read more from the [Indexing Content](/crawler/indexing) page.

### `respect_robots_meta: boolean` {#respect_robots_meta}

Respect robots meta tags like

```html
<meta name="robots" content="noindex, nofollow" />
```

Defaults to `true`.

### `respect_robots_txt: boolean` {#respect_robots_txt}

Respect `/robots.txt` rules.

Defaults to `true`.

### `deny_patterns: string[]` {#deny_patterns}

Skip paths matching the given pattern.
Matches against the url pathname.

Supports string prefixes and regexes. See [Indexing Content](/crawler/indexing) for details.

### `max_pages: number` {#max_pages}

Max pages to crawl. If this limit is exceeded the crawler will just stop.

### `cache_bust: boolean` {#cache_bust}

Add random query string to the crawl http requests. This can cause a lot of load to
the target webserver as the caches will very likely be bypassed but it can be used to
ensure that the crawler always sees the latest version of the pages.

Defaults to `false`.


### `crawl_pdfs: boolean` {#crawl_pdfs}

Crawl PDF files too. See the [PDF docs](/crawler/pdf) for details.

Defaults to `false`.

### `tags: Array` {#tags}

Array tagging matchers. [Documented on the dedicated page](tags).


## `[search-endpoint]` {#search-endpoint}

Search endpoint configuration.

### `origin_domains: string[]` {#origin_domains}

List of origin domains from which the search endpoint can be accessed eg. the
domains where the Findkit UI library can installed. The domain is validated
using the [Origin
header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin) sent
by the browsers.

This defaults to the first [target host](#host).

Example

```toml
[search-endpoint]
origin_domains = ["mysite.example"]
```


### `private: boolean` {#private}

Make search endpoint private by requiring a JWT token. Must be combined with
`public_key`.

Defaults to `false`.


### `public_key: boolean` {#private}

When `private` is set to `true` this RS256 public key is used to validate JWT
tokens in the search requests.

See our [WordPress
plugin](https://github.com/findkit/wp-findkit#jwt-authentication) for full
integration.
