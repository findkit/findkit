---
sidebar_position: 2
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

### `respect_robots_meta: boolean`

Respect robots meta tags like

```html
<meta name="robots" content="noindex, nofollow" />
```

Defaults to `true`.

### `respect_robots_txt: boolean`

Respect `/robots.txt` rules.

Defaults to `true`.
