---
sidebar_position: 3
---

# Tagging Content

The crawler can tag the content for [filtering](/ui/filtering).

By default few default tags are added

- Domain tag
  - `domain/example.com`
- Content-type tag
  - `html`or `pdf`
- Language
  - `language/en`, `language/fi` etc.

You can list the available tags in your project with

```
findkit tags
```

## Custom Tags

Use the `tags` [meta tag field](/crawler/meta-tag#tags-string) to add your own
custom tags to pages.

If you use WordPress you can use [our WordPress
plugin](https://github.com/findkit/wp-findkit) to generate the tags
automatically from taxonomies.

TODO regex tagger
