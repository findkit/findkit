# Tagging Pages

The crawler can tag the content for [filtering](/ui/api/params) and
[grouping](/ui/api/groups).

By default following tags are added

- Domain tag
  - `domain/example.com`
- Content-type tag
  - `html` or `pdf`
- Language
  - `language/en`, `language/fi` etc.

You can list the available tags in your project with

```
findkit tags
```

You can check the tags on any given page with

```
findkit inspect <url>
```

## Custom Tags

Custom tags can be added

- In the [`tags` meta tag field](/crawler/meta-tag#tags)
- In `findkit.toml` with the [`tags` field](/toml/tags) using CSS and regexes
- With WordPress you can use [our WordPress
  plugin](https://github.com/findkit/wp-findkit) to generate the tags
  automatically from taxonomies and any custom ones with PHP
