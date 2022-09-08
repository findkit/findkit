---
sidebar_position: 1
---

# Crawler Configuration

The crawler is configured using a `findkit.toml` file which is authored in a
[TOML format](https://toml.io/).

## Top-Level Options

### `id: string`

The project identifier within the organization.

### `name: string`

Human readable name of project. Displayed in the Hub.

### `description: string`

Description of the project. Displayed in the Hub.

### `schedule_full_crawl`

Run the full crawl automatically with the given schedule.

Allowed values

- `weekly`
- `daily`

This is the same as running `findkit crawl start`. Read more from ["Starting
Crawls"](/crawler/starting#full).

### `schedule_update_crawl`

This is the same as running `findkit crawl start --updated`.
Read more from ["Starting Crawls"](/crawler/starting#partial).

:::danger
This option is not available yet.
:::

### `targets: object[]`

List "targets" aka domain to crawl content from

## Target Options

Options for `[[targets]]` sections.

### `use_sitemap: boolean`

Read the site sitemap.

Defaults to `true`.

### `walk_links: boolean`

Find site pages by walking the links. If the site has a proper sitemap this
should be set to false.

Defaults to `true`.

### `content_selector: string`

CSS selector used to select the text content for indexing.

Read more from the [Indexing Content](/crawler/indexing) page.

### `cleanup_selector: string`

CSS selector used to skip elements from indexing.

Read more from the [Indexing Content](/crawler/indexing) page.

### `respect_robots_meta: boolean`

Respect robots meta tags like

```html
<meta name="robots" content="noindex, nofollow" />
```

Defaults to `true`.

### `respect_robots_txt: boolean`

Respect `/robots.txt` rules.

Defaults to `true`.

### `tags`

Array tagging matchers. [Documented on the dedicated page](tags).
