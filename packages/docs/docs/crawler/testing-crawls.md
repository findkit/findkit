# Testing Crawls

When working with crawlers you need to be able able to check that crawler works
correctly on your site without actually updating the production index.

For this we provide the `findkit crawl test` subcommand. Example

```
findkit test crawl "https://docs.findkit.com/crawler/running-crawls/"
```

This will read current the `findkit.toml` file from the current working
directory or one pointed by `--path` and will ask Findkit crawler
infrastructure to crawl the given page with current toml config. Eg. you can
test toml changes that are not yet deployed with `findkit deploy`. It will report
how it crawled the page.

The output is following

```
HTTP Status: 200
Crawl Status: ok
Message:
URL: https://docs.findkit.com/crawler/running-crawls/
Title: Running Crawls
Language: en
Created: 2023-10-24T07:54:15.483Z
Modified: 2023-10-24T07:54:15.483Z
Tags: language/en, crawler
Content: Running Crawls Findkit can crawl pages in three modes…
[add --content to show all 1634 characters]
```

It can also detect bad urls

```
$ findkit crawl test "https://docs.findkit.com/bad"
HTTP Status: 404
Crawl Status: skipped
Message: Gone
```

or toml bad toml configs

```
$ findkit crawl test "https://docs.findkit.com/crawler/running-crawls"
Crawl Status: skipped
Message: Denied by deny pattern: /crawler
```

or even toml invalid toml configs

```
$ findkit crawl test "https://docs.findkit.com/crawler/running-crawls"
[ERROR] Invalid TOML syntax at findkit.toml
[ERROR]     Unterminated string at row 13, col 25, pos 345:
[ERROR] 12: [[targets]]
[ERROR] 13> host = "docs.findkit.com
[ERROR]                             ^
[ERROR] 14:
```

## Testing localhost

When developing the [Findkit Meta Tag](/crawler/meta-tag) you can run the crawl
using `--local` override and target your local development site.

```
findkit test crawl --local "http://localhost:3000/crawler/running-crawls/" "https://docs.findkit.com/crawler/running-crawls/"
```

This first runs a local HTTP GET request from the CLI process to the URL
provided in `--local` and sends the received HTML string with the test
crawl URL to the Findkit crawler. Then the crawler will just directly parses
the given HTML without making itself making HTTP requests.

This can be used crawl any site accessible from you local machine for example
staging sites that are behind firewalls etc.

## Testing local files

The `--local` flag can also point to a local file

```
findkit test crawl --local page.html "https://docs.findkit.com/crawler/running-crawls/"
```

This can be useful if you need to quickly try out how to fix production site.

For example use curl download the page

```
curl "https://docs.findkit.com/crawler/running-crawls/" > page.html
```

Try making some fixes to the html with your favorite editor

```
vim page.html
```

and see if it worked

```
findkit test crawl --local page.html "https://docs.findkit.com/crawler/running-crawls/"
```
