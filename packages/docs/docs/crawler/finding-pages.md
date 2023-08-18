# Finding Pages

Findkit crawler uses following algorithm to find pages to crawl in full mode:

1. It checks for `/robots.txt` for what pages it is allowed to crawl
2. It reads the sitemaps reported in the `Sitemap:` entries in `/robots.txt`
3. If sitemaps are found it only crawls the pages reported by the sitemaps
4. If no sitemaps are found it fallbacks to walking links starting from `/`
    - The start paths can be customised by setting [`start_paths`](/toml/#start_paths)

This behaviour can be customized by setting [`use_sitemap`](/toml/#use_sitemap)
and/or [`walk_links`](/toml/#walk_links) explicitly.

[Partial crawl](/crawler/starting#partial) only crawls pages reported by
the sitemaps as it needs the last modified information.
