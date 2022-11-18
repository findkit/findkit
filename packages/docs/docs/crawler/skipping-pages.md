# Skipping Pages

Your website might include include pages that you do not want to be
included in the search index. For this purpose you can use one of the
options listed below

## Robots.txt

Place `/robots.txt` to website root.
For more info refer to [documentation](https://developer.mozilla.org/en-US/docs/Glossary/Robots.txt).

You can instruct Findkit Crawler to not to respect `/robots.txt` rules with [respect_robots_txt](/crawler/toml/index#respect_robots_txt) configuration option.

## Meta Robots Tag

By placing robots meta tag on an individual page you can instruct crawlers, findkit included,
to not index the page or not to follow links on the page.

For more information see Google's [documentation](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

You can instruct Findkit Crawler to not to respect robots meta rules [respect_robots_meta](/crawler/toml/index#respect_robots_meta).

## Deny Patterns {#deny_patterns}

You can define patterns for crawler to skip in `findkit.toml`.
Patterns can be strings or regexes in string staring with `reg:`. Regexes need to be written as strings without the encapsulating `//`

Strings are matched to start of any [URL pathname](https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname).
Regular Expression patterns are matched against the whole URL pathname.

You can define as many deny patterns as you need, but there are better options available for skipping individual urls.

Example deny pattern string:

```toml
[[targets]]
host = "example.com"
content_selector = ".content, .post"
# highlight-next-line
deny_patterns = ["/secret/"]
```

Would cause crawler to skip:

- `example.com/secret/`
- `example.com/secret/first_secret`
  But would not skip:
- `example.com/secret` extraneous `/` at the end of deny pattern
- `example.com/some_folder/secret/` deny pattern is matched against the start of the URL pathname

Example deny pattern regular expression:

```toml
[[targets]]
host = "example.com"
content_selector = ".content, .post"
# highlight-next-line
deny_patterns = ["reg:/secret"]
```

Would cause crawler to skip:

- `example.com/secret`
- `example.com/secret/`
- `example.com/secret/first_secret`
- `example.com/some_folder/secret/`
- `example.com/some_folder/secret/first_secret`
- `example.com/secretariat/big_red`
