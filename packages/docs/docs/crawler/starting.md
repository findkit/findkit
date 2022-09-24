# Starting Crawls

The crawls can be started using the CLI, `findkit.toml` schedules and the REST
API for CMS integrations.

## CLI

The CLI can start the crawls in three different ways:

### Full

Start full crawl as configured in the `findkit.toml` file:

```
findkit crawl start
```

This will re-index every page on the site every time.

### Partial

Crawl only the pages that have updated content:

```
findkit crawl start --updated
```

This requires your site to have a proper sitemap with `<lastmod>` (last modified
date) entries. It will read the sitemap, compare the `lastmod` entries to the
previously crawled entries and will only crawl the pages that have have been
updated since.

Links will not be walked even if
[`walk_links`](/crawler/toml/#walk_links-boolean) is set to true.

### Single

You can also start a crawl only for a single url

```
findkit crawl start --url <url>
```

## Scheduling

Crawls can be also scheduled via the `findkit.toml` file with the
[`schedule_full_crawl`](/crawler/toml/#schedule_full_crawl) and
[`schedule_update_crawl`](/crawler/toml/#schedule_update_crawl) fields.

The schedules will be active immediately when the TOML file
is deployed with `findkit deploy`. If you need to disable the
schedules just comment them out and run the deploy.

## REST API

Crawls be also triggered using our REST API. This can be used to create deep CMS
integrations where individual pages are re-indexed immediately when changes are
saved.

:::caution
Coming soon!
:::
