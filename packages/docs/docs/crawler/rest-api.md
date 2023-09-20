# REST API

The REST API can be used to start crawls.

## API Keys

Go to your project in the Findkit Hub and generate the API KEY in ***Settings*** -> ***API Keys***.

## Examples

Substitude with `{{PUBLIC_TOKEN}}` with the project public token found from the
project page in Hub and `{{API_KEY}}` with generate api key.

### `curl` {#curl}

```
curl -X POST \
    --fail-with-body \
    --data '{"mode": "manual", "urls": ["https://example.com/page"]}' \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer {{API_KEY}}" \
    https://api.findkit.com/v1/projects/{{PUBLIC_TOKEN}}/crawls
```


The following examples use the [httpYac](https://httpyac.github.io/) format.

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


## OpenApi

Check out the generated [OpenAPI docs](https://redocly.github.io/redoc/?url=https://api.findkit.com/v1/openapi.json&nocors)

The OpenAPI schema is available here:

<https://api.findkit.com/v1/openapi.json>
