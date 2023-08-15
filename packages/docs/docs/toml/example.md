 # Example

 Example of [`findkit.toml`](/toml)


```toml
id = "pd32hfasd"
name = "My Website Network"
description = "Description for hub.findkit.com"

# Run lighter partial crawl daily
schedule_partial_crawl = "daily"

# And full crawl every week to ensure everyting is up to date
schedule_full_crawl = "weekly"

[[targets]]
host = "www.mysite.example"

# Findkit can automatically extract the text content from pages but it often
# reasonable to be explicit where the text content is extracted.
content_selector = ".content"

# Do not index ad content even if it is inside .content
cleanup_selector = ".ad"


# Ex. "Mysite - About" capture only "About"
title_selector_regex = "^Mysite - (.*?)$"

# Default value, but could be customzid
title_selector = "head title"

# If the site has proper sitemap there's no need to use link walking as the
# crawler can find all pages using the sitemap
use_sitemap = true
walk_links = false
crawl_pdfs = true

# If using walk_links this can be used to define where the link walking starts
start_paths = [
  "/",
  "/subpath/",
]

# Add reasonable max limit to avoid over using our crawl quota
max_pages = 50_000


# Avoid indexing tag listing pages
deny_patterns = [ "/tags" ]


# Add `event` tag to pages under https://www.mysite.example/events/
[[targets.tags]]
pathname_regex = '^\/events\/'
on_match = "event"


# Crawl additional domain to the same index
[[targets]]
host = "blog.example"

# Add `author` tag to pages under https://blog.example/authors/
[[targets.tags]]
pathname_regex = '^\/authors\/'
on_match = "author"


[search-endpoint]
# Allow Findkit UI installations on these domains
origin_domains = ["www.mysite.example", "intra.mysite.example"]


```
