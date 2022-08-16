# Findkit Fetch

Low level read-only API for Findkit indices used by
[@valu/react-valu-search](https://docs.valusearch.pro/react-valu-search/introduction).

## Install

```
npm install @findkit/fetch
```

In browsers it uses the native `fetch()` but in Node.js you must provide it from
node-fetch and set it as global.

## Usage

```ts
import { findkitFetch } from "@findkit/fetch";

// Returns SearchResponse[]
const responses = await findkitFetch({
    // See FindkitFetchOptions below for more details
    customer: "wikipedia",
    terms: "genie",
    apiKey: "your-api-key-here", // Contact your Findkit provider for api key
    groups: [
        {
            tagQuery: [],
            size: 10,
            from: 0,
        },
    ],
});
```

Each group will add a `SearchResponse` object to the resolved array. The array
order will correspond with the groups order.

## API

`findkitFetch()` takes `FindkitFetchOptions` as request params and returns
`Promise<SearchResponse[]>`.

```ts
function findkitFetch(params: FindkitFetchOptions): Promise<SearchResponse[]>;

interface FindkitFetchOptions {
    terms: string;
    groups: SearchGroupParams[];
    customer?: string;
    searchEndpoint?: string;
    apiKey: string;
    staging?: boolean;
    logResponseTimes?: boolean;
}

interface SearchGroupParams {
    tagQuery: string[][];
    createdDecay?: number;
    modifiedDecay?: number;
    decayScale?: string;
    highlightLength?: number;
    size: number;
    from: number;
    lang?: string;
}

interface SearchResponse {
    total: number;
    duration?: number;
    hits: {
        score: number;
        title: string;
        language: string;
        url: string;
        domain: string;
        created: string;
        modified: string;
        highlight: string;
        tags: string[];
        customFields: CustomFields;
    }[];
}

type CustomFields = {
    [customField: string]:
        | { type: "date"; value: string }
        | { type: "keyword"; value: string }
        | { type: "number"; value: number }
        | undefined;
};
```
