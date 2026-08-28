# REST API

The REST API can be used to start crawls and to read the link report.

## API Keys

Go to your project in the Findkit Hub and generate the API KEY in **_Settings_** -> **_API Keys_**.

## API Endpoints

Check out the generated [OpenAPI docs](https://redocly.github.io/redoc/?url=https://api.findkit.com/v1/openapi.json&nocors). The OpenAPI schema is available [here](https://api.findkit.com/v1/openapi.json)

### Full Crawl {#full-crawl}

Start a [full crawl](/crawler/running-crawls#full).

```
POST https://api.findkit.com/v1/projects/{{PUBLIC_TOKEN}}/crawls
Content-Type: application/json
Authorization: Bearer {{API_KEY}}

{
    "mode": "full",
}
```

### Partial Crawl {#partial-crawl}

Start a [partial crawl](/crawler/running-crawls#partial).

```
POST https://api.findkit.com/v1/projects/{{PUBLIC_TOKEN}}/crawls
Content-Type: application/json
Authorization: Bearer {{API_KEY}}

{
    "mode": "partial",
}
```

### Manual Crawl {#manual-crawl}

Start a [manual crawl](/crawler/running-crawls#manual).

```
POST https://api.findkit.com/v1/projects/{{PUBLIC_TOKEN}}/crawls
Content-Type: application/json
Authorization: Bearer {{API_KEY}}

{
    "mode": "manual",
    "urls": ["https://www.example.com/page"]
}
```

### Link Report {#link-report}

Read the links pointing at pages that are missing, forbidden, failing or
redirected. Requires [`track_links = "all"`](/toml/options#track_links) on the
target. The report is built from the data collected during the crawl, so
reading it sends no requests to your site.

```
GET https://api.findkit.com/v1/projects/{{PUBLIC_TOKEN}}/link-report
Authorization: Bearer {{API_KEY}}
```

Optional query parameters

- `target` limit the report to a single target host
- `limit` how many links to return at most. From 1 to 5000, defaults to 1000

The links are grouped by the page they were found on, in one section per
reason. Trimmed example response:

```json
{
	"notFound": {
		"count": 1,
		"pages": [
			{
				"url": "https://www.example.com/about",
				"links": [
					{
						"url": "https://www.example.com/old-page",
						"httpStatus": 404,
						"message": "Gone"
					}
				]
			}
		]
	},
	"forbidden": { "count": 0, "pages": [] },
	"serverError": { "count": 0, "pages": [] },
	"redirect": { "count": 0, "pages": [] },
	"unknown": { "count": 0, "pages": [] },
	"targets": [{ "host": "www.example.com", "linkTracking": "all" }],
	"truncated": false
}
```

`redirect` entries also carry `redirectsTo` with the url the link leads to.
`unknown` lists links the crawler found but did not fetch, which happens only
when the crawl stopped early, for example when `max_pages` was reached.

## Usage

The above examples use the [httpYac](https://httpyac.github.io/) format.
To run them using it save the examples to a file with a `.http` extension and run the following command:

```http
httpyac send example.http --var API_KEY=aJxryVb:sJLe5Crb2op5Bld2hTqdvlj7y --var PUBLIC_TOKEN=p2nGrEaD7:eu-north-1
```

using your own `API_KEY` and `PUBLIC_TOKEN`.

Or just manually build the request for your favorite HTTP client replacing `{{API_KEY}}` and `{{PUBLIC_TOKEN}}` with your own values.

Here's an example with curl:

```sh
curl --fail-with-body --data '{"mode": "full"}' -H 'content-type: application/json' -H "Authorization: Bearer aJxryVb:sJLe5Crb2op5Bld2hTqdvlj7y"  https://api.findkit.com/v1/projects/p2nGrEaD7:eu-north-1/crawls
```
