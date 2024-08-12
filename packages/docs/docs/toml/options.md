# Options

<FragmentOverride text="Crawler Option" />

<Fragmented withH1 />

Options for the `findkit.toml` configuration file.

## Top-Level Options

<FragmentOverride text="Top-Level" />

### `id: string` {#id}

The project identifier within the organization.

### `name: string` {#name}

Human readable name of project. Displayed in the Hub.

### `description: string` {#description}

Description of the project. Displayed in the Hub.

### `ml_model: "openai"` {#ml_model}

Machine learning model to use in text embedding vector generation for Semantic AI search. Required with the [`semantic`](/ui/api/params#semantic) search param.

```toml
ml_model = "openai"
```

Available only in some subscription plans. See pricing for details.

:::caution
This option must be set before the first crawl since it is used when initializing the index.
If project is crawled before setting this option the index must be reset in the project settings to change the model.
:::

### `schedule_full_crawl: string` {#schedule_full_crawl}

Run the full crawl automatically with the given schedule.

Allowed values

- `weekly`
- `daily`
- `every-3-days`
- `every-2-days`

This is the same as running `findkit crawl start`. Read more from ["Running
Crawls"](/crawler/running-crawls#full).

### `schedule_partial_crawl: string` {#schedule_partial_crawl}

This is the same as running `findkit crawl start --partial`.
Read more from ["Running Crawls"](/crawler/running-crawls#partial).

Allowed values

- `weekly`
- `daily`
- `every-3-days`
- `every-2-days`

### `targets: object[]` {#targets}

List "targets" aka domains to crawl content from. See [`[[targets]]`](#target-options)

## `[[targets]]` {#target-options}

Options for `[[targets]]` sections.

This is an array of tables. See the TOML [docs on Arrays](https://toml.io/en/v1.0.0#array-of-tables).

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

List of pages where to start link walking when [`walk_links`](#walk_links) is
enabled.

Defaults to `/`

### `content_selector: string` {#content_selector}

CSS selector used to select the text content for indexing.

Read more from the [Indexing Content](/crawler/indexing) page.

### `content_no_highlight_selector: string` {#content_no_highlight_selector}

Get value for [`contentNoHighlight`](/crawler/meta-tag#contentNoHighlight) using a CSS selector.

### `cleanup_selector: string` {#cleanup_selector}

CSS selector used to skip elements from indexing.

Read more from the [Indexing Content](/crawler/indexing) page.

### `respect_robots_meta: boolean` {#respect_robots_meta}

Respect robots meta tags like

```html
<meta name="robots" content="noindex, nofollow" />
```

Pages get "Denied by robots meta" message when they are not indexed because of this tag.

Defaults to `true`.

### `respect_robots_txt: boolean` {#respect_robots_txt}

Respect `/robots.txt` rules.

Defaults to `true`.

### `sitemaps: string[]` {#sitemaps}

Explicitly use sitemaps from these paths. When defined the sitemap entries in robots.txt are ignored. The paths may reference an actual sitemap or a sitemap index. Supports only paths.

If this option is not defined and robots.txt does not contain sitemap entries `/sitemap.xml` is read.

Example

```toml
sitemaps = ["/custom/sitemap.xml", "/another/sitemap.xml"]
```

### `deny_patterns: string[]` {#deny_patterns}

Skip paths matching the given pattern.
Matches against the url pathname.

Supports string prefixes and regexes. See [Indexing Content](/crawler/indexing) for details.

### `max_pages: number` {#max_pages}

Max pages to crawl.
This is a safety limit to make sure the crawler stops in the case where
the site generates pages and links inifinitely.

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

### `request_headers: Object` {#headers}

Request headers to be sent with the http requests the crawler sends out. These
can be for example used to authenticate the crawler with non public websites.

Example

```toml
[[targets]]
host = "intra.example.com"
# Send basic auth header
request_headers = { Authorization = "Basic ZmluZGtpdDpodW50ZXIyCg==" }
```

### `concurrency: number` {#concurrency}

How many concurrent requests to make on your sites. Defaults to `5` but if you
encounter "429 Too Many Requests" or "503 Service Unavailable" errors you might
want to lower this value.

### `crawl_delay: number` {#crawl_delay}

If lowering `concurrency` to `1` is not enough you can try add additional delay
between the requests. Note that this is counted towards your subscription crawl
time. The delay is set in milliseconds.

Example

```toml
[[targets]]
host = "example.com"
# Send only one request every 500ms
concurrency = 1
crawl_delay = 500
```

### `request_timeout: number` {#request_timeout}

Set request timeout in milliseconds. Defaults to `10000` (10 seconds).
Generally you should avoid setting this to a very high value as it can cause
the crawler to burn through your crawl time if your website is very slow
to respond.

Example

```toml
[[targets]]
host = "example.com"
request_timeout = 60000
```

## `[search-endpoint]` {#search-endpoint}

<FragmentOverride text="Search Endpoint" />

Search endpoint configuration. Search endpoint configurations changes
might take up 10 minutes to propagate.

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

### `public_key: boolean` {#public_key}

When `private` is set to `true` this RS256 public key is used to validate the
JWT tokens in the search requests.

See our [WordPress
plugin](https://github.com/findkit/wp-findkit#jwt-authentication) for full
integration.

### `allow_content: boolean` {#allow_content}

Allow usage of the [`content`](/ui/api/params#content) query in the search params.

Defaults to `false`.

Example

```toml
[search-endpoint]
allow_content = true
```
