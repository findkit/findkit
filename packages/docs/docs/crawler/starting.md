# Starting Crawls

Crawls can be started using the CLI, `findkit.toml` schedules and the REST
API for CMS integrations.

## CLI

The CLI can start crawls in three different modes:

### Full

Start full crawl as configured in the `findkit.toml` file:

```
findkit crawl start
```

This will re-index every page on the site every time.

### Partial

Run crawl only on pages that have updated content:

```
findkit crawl start --partial
```

This requires your site to have a proper sitemap with `<lastmod>` (last modified
date) entries. It will read the sitemap, compare the `lastmod` entries to the
previously crawled entries and will only crawl the pages that have have been
updated since.

Links will not be walked even if
[`walk_links`](/crawler/toml/#walk_links) is set to true.

### Manual

Run crawl on a single url

```
findkit crawl start --manual <url>
```

## Scheduling

Schedule crawls with the `findkit.toml` file using the
[`schedule_full_crawl`](/crawler/toml/#schedule_full_crawl) and
[`schedule_partial_crawl`](/crawler/toml/#schedule_partial_crawl) fields.

The schedules will be active immediately when the TOML file
is deployed with `findkit deploy`. If you need to disable the
schedules just comment them out and run the deploy.
