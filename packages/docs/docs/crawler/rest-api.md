# REST API

The REST API can be used to start crawls.

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
