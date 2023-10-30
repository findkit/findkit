# Testing Crawls

When working with crawlers you need to be able able to check that crawler works
correctly on your site without actually updating the production index.

For this we provide the `findkit crawl test` subcommand. Example

```
findkit crawl test "https://docs.findkit.com/crawler/running-crawls/"
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

## Testing local dev and staging sites

You can run the crawl against localhost with `--local-http` and `--target`.

```
findkit crawl test --local-http --target docs.findkit.com "http://localhost:3000/crawler/running-crawls/"
```

This uses the `docs.findkit.com` target from the toml config and makes the HTTP request to

```
http://localhost:3000/crawler/running-crawls/
```

directly from the CLI process.

The HTML string is then passed to the Findkit crawler to be parsed. It will see
an artificial response to `http://localhost:3000/crawler/running-crawls/` with
the locally fetched HTML. It does itself not make any outgoing network
requests.

:::tip
If your toml file has only one target the `--target` option can omitted when
using `--local-http`
:::

This can be used crawl any site accessible from you local machine. For example
staging sites that are behind firewalls etc.

## Testing local files

It is also possible to crawl local files with `--file`

```
findkit crawl test --file page.html "https://docs.findkit.com/crawler/running-crawls/"
```

This can be useful if you need to quickly try out how to fix production site.

For example use curl to download a page

```
curl "https://docs.findkit.com/crawler/running-crawls/" > page.html
```

Try making some fixes to the html with your favorite editor

```
vim page.html
```

and see if it worked

```
findkit crawl test --file page.html "https://docs.findkit.com/crawler/running-crawls/"
```
