# Tags

<FragmentOverride text="Crawler Tagging" />

<Fragmented h1Content />

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

## Matchers

### `css`

Add the tag when the css selector matches to at least one element

Example

```toml
[[targets.tags]]
css = ".foo"
on_match = "foo"
```

When page has an element like `<div class="foo">` a `foo` tag is added.

### `pathname_pattern`

Match pathnames with the [URLPattern syntax](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API#pattern_syntax).

:::danger
Not implemented yet.
:::

### `pathname_regex`

Match the regex to the page's pathname.

Example

```toml
[[targets.tags]]
pathname_regex = '^\/author\/'
on_match = "author"
```

This would add the `author` tag to all pages under `/author/`.

Eg. on page `https://example.com/author/john-doe` the regex is matched againts
`/author/john-doe` string.

:::tip
Always use [single quotes](https://toml.io/en/v1.0.0#string) with
`pathname_regex` to avoid having to escape the backslash characters (`\`).
:::

#### Groups

You can use the regex capture groups when creating the tag. Apply the group with
`$1` where number corredponds with the group index starting from 1.

Example

With input url `https://docs.findkit.com/ui/filtering` and following config

```toml
[[targets.tags]]
# Match string starting with '/' and capture non '/' chars after that
pathname_regex = '^\/([^\\/]+)'
on_match = "$1"
```

a `ui` tag will be added.
