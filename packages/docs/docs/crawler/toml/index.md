# Crawler Configuration

The crawler is configured using a `findkit.toml` file which is authored in a
[TOML format](https://toml.io/).

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

This is the same as running `findkit crawl start`. Read more from ["Starting
Crawls"](/crawler/starting#full).

### `schedule_update_crawl: string` {#schedule_update_crawl}

This is the same as running `findkit crawl start --updated`.
Read more from ["Starting Crawls"](/crawler/starting#partial).

:::danger
This option is not available yet.
:::

### `targets: object[]` {#targets}

List "targets" aka domain to crawl content from

## Target Options

Options for `[[targets]]` sections.

### `use_sitemap: boolean` {#use_sitemap}

Read the site sitemap.

Defaults to `true`.

### `walk_links: boolean` {#walk_links}

Find site pages by walking the links. If the site has a proper sitemap this
should be set to false.

Defaults to `true`.

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

Supports string prefixes and regexes. See [Indexing Content](../indexing) for details.

### `max_pages: number` {#max_pages}

Max pages to crawl. If this limit is exceeded the crawler will just stop.

### `tags: Array` {#tags}

Array tagging matchers. [Documented on the dedicated page](tags).
