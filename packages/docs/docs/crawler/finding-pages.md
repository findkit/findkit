# Finding Pages

Findkit can crawl pages in three modes. Full, partial and manual.

## Full Crawl

Findkit crawler uses following algorithm to find pages to crawl in full mode:

1. It checks for `/robots.txt` for what pages it is allowed to crawl
2. It reads the sitemaps reported in the `Sitemap:` entries in `/robots.txt`
3. If sitemaps are found it only crawls the pages reported by the sitemaps
4. If no sitemaps are found it fallbacks to walking links starting from `/`
   - The start paths can be customised by setting [`start_paths`](/toml/options#start_paths)

This behaviour can be customized by setting [`use_sitemap`](/toml/options#use_sitemap)
and/or [`walk_links`](/toml/options#walk_links) explicitly.

[Partial crawl](/crawler/starting#partial) only crawls pages reported by
the sitemaps as it needs the last modified information.

Full crawl can be started from the Hub, CLI, REST API and from a schdule
defined in the toml config.

Example

```
findkit crawl start
```


## Partial Crawl

Partial crawl only checks for sitemaps and only crawls the pages where the last
modified timestamp has changed since the last crawl. This can greatly save
crawl quotas compared to full crawls.

Partial crawl can be started from the Hub, CLI, REST API or from a schdule.

Example

```
findkit crawl start --partial
```

## Manual Crawl

Manual crawl will crawl only the urls you spesify when start the crawl. Manual
crawls can be started using CLI and REST API.

Example


```
findkit crawl start --manual "https://www.example.com/page"
```

