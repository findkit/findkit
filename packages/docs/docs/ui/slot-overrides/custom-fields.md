# Custom Fields

Custom fields are pieces of content saved within the indexed page which are
returned when the pages are searched. These can be used to render additional
content directly on the search results view such as Product price and images on
E-commerence sites, author names on blogs etc.

Custom fields are defined using the `customFields` entry in the [Crawler Meta
Tag](/crawler/meta-tag#customFields).

The fields are accessible in the [`Hit` slot
override](/ui/slot-overrides/slots#hit).

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	slots: {
		Hit(props) {
			const fields = props.hit.customFields;

			return html`
                <h2>${props.hit.title}</h1>
                <img src="${props.hit.customFields.thumbnail.value" />
            `;
		},
	},
});
```

In the target page head:

```html
<script id="findkit" type="application/json">
	{
		"customFields": {
			"thumbnail": {
				"type": "keyword",
				"value": "https://example.com/image.jpg"
			}
		}
	}
</script>
```

## Demo

Here's an example where we render the embedded example links directly on the
search results. The custom fields [are
created](https://github.com/findkit/findkit/blob/6c9ac28814cd47afc590da9d2c5f6f3f44f31018/packages/docs/src/theme/MDXComponents.tsx#L74-L100)
using the Docusaurus MDX support.

<Codesandbox example="static/custom-fields" />
