---
sidebar_position: 2
---

# `tags`

Matchers used to [tag pages](/crawler/tagging).

The `tags` field is an array field under the `targets` array in the
`findkit.toml` file which can be used to match content to different tags.

The config looks like this

```toml
[[targets]]
host = "example.com"

[[targets.tags]]
pathname_regex = "regex" # the matcher
on_match = "tag" # the tag to apply
```

The tag in the `on_match` field will be applied when the matcher matches.

### Matchers

### `pathname_regex`

Match the regex to the page's pathname.

Example

```toml
[[targets.tags]]
pathname_regex = "^\/author\/"
on_match = "author"
```

This would add the `author` tag to all pages under `/author/`.

Eg. on page `https://example.com/author/john-doe` the regex is matched againts
`/author/john-doe` string.

TODO regex groups

### `css`

Add the tag when the css selector matches to at least one element

Example

```toml
[[targets.tags]]
css = ".foo"
on_match = "foo"
```

When page has an element like `<div class="foo">` a `foo` tag is added.
