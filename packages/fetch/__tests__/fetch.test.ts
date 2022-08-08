import { findkitFetch } from "..";
import { rest } from "msw";
import { sign } from "jsonwebtoken";

import fetch from "node-fetch";

import { setupServer } from "msw/node";
import {
    createFindkitFetcher,
    getRequestBody,
    JwtErrorResponse,
} from "../src/index";

/**
 * The token content does not matter in these tests since @findkit/fetch does
 * not parse its content
 */
function createJwtToken() {
    return sign({ foo: "bar" }, "secret");
}

Object.assign(global, { fetch });

const server = setupServer();

beforeEach(async () => {
    server.listen();
});

afterEach(async () => {
    server.close();
    server.resetHandlers();
});

type FindkitFetchResponse = Awaited<ReturnType<typeof findkitFetch>>;

describe("request body generation", () => {
    test("without tags", () => {
        const body = getRequestBody({
            q: "test",
            groups: [
                {
                    tagQuery: [[]],
                    size: 5,
                    from: 0,
                    createdDecay: undefined,
                    modifiedDecay: undefined,
                    decayScale: undefined,
                    highlightLength: undefined,
                    lang: undefined,
                },
            ],
        });

        expect(body).toEqual({
            q: "test",
            groups: [
                {
                    tagQuery: [[]],
                    size: 5,
                    from: 0,
                },
            ],
        });
    });

    test("without tags", () => {
        const body = getRequestBody({
            q: "test",
            groups: [
                {
                    tagQuery: [["tag"]],
                    size: 5,
                    from: 0,
                    createdDecay: undefined,
                    modifiedDecay: undefined,
                    decayScale: undefined,
                    highlightLength: undefined,
                    lang: undefined,
                },
            ],
        });

        expect(body).toEqual({
            q: "test",
            groups: [
                {
                    tagQuery: [["tag"]],
                    size: 5,
                    from: 0,
                },
            ],
        });
    });

    test("with lang", () => {
        const body = getRequestBody({
            q: "test",
            groups: [
                {
                    tagQuery: [["tag"]],
                    size: 5,
                    from: 0,
                    lang: "de",
                    createdDecay: undefined,
                    modifiedDecay: undefined,
                    decayScale: undefined,
                    highlightLength: undefined,
                },
            ],
        });

        expect(body).toEqual({
            q: "test",
            groups: [
                {
                    tagQuery: [["tag"]],
                    lang: "de",
                    size: 5,
                    from: 0,
                },
            ],
        });
    });
});

describe("fetch", () => {
    test("empty fetch", async () => {
        server.use(
            rest.post("https://test.invalid/multi-search2", (req, res, ctx) => {
                const resData: FindkitFetchResponse = {
                    groups: [],
                    duration: 123,
                };
                return res(ctx.json(resData));
            }),
        );
        const res = await findkitFetch({
            searchEndpoint: "https://test.invalid/multi-search2",
            q: "",
            groups: [],
        });

        expect(res).toEqual({ duration: 123, groups: [] });
    });
});

describe("jwt", () => {
    test("calls getJwtToken() and passes the token as bearer", async () => {
        const spy = jest.fn();

        server.use(
            rest.post("https://test.invalid/multi-search2", (req, res, ctx) => {
                spy(req.headers.get("authorization"));
                const resData: FindkitFetchResponse = {
                    groups: [],
                    duration: 123,
                };
                return res(ctx.json(resData));
            }),
        );

        const fetcher = createFindkitFetcher({
            async getJwtToken() {
                return { jwt };
            },
        });

        const jwt = createJwtToken();

        const res = await fetcher.findkitFetch({
            searchEndpoint: "https://test.invalid/multi-search2",
            q: "",
            groups: [],
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith("Bearer " + jwt);
        expect(res).toEqual({ duration: 123, groups: [] });
    });

    test("calls getJwtToken() only once for multiple fetches", async () => {
        const spy = jest.fn();

        server.use(
            rest.post("https://test.invalid/multi-search2", (req, res, ctx) => {
                const resData: FindkitFetchResponse = {
                    groups: [],
                    duration: 123,
                };
                return res(ctx.json(resData));
            }),
        );

        const fetcher = createFindkitFetcher({
            async getJwtToken() {
                spy();
                return { jwt };
            },
        });

        const jwt = createJwtToken();

        for await (const i of Array(5).keys()) {
            await fetcher.findkitFetch({
                searchEndpoint: "https://test.invalid/multi-search2",
                q: i.toString(),
                groups: [],
            });
        }

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("calls getJwtToken() again when server responds with expired error", async () => {
        let expired = false;

        server.use(
            rest.post("https://test.invalid/multi-search2", (req, res, ctx) => {
                if (expired) {
                    expired = false;
                    const data: JwtErrorResponse = {
                        error: { type: "jwt-expired" },
                    };
                    return res(ctx.status(403), ctx.json(data));
                }

                const resData: FindkitFetchResponse = {
                    groups: [],
                    duration: 123,
                };
                return res(ctx.json(resData));
            }),
        );

        const spy = jest.fn();

        const fetcher = createFindkitFetcher({
            async getJwtToken() {
                spy();
                const jwt = createJwtToken();
                return { jwt };
            },
        });

        await fetcher.findkitFetch({
            searchEndpoint: "https://test.invalid/multi-search2",

            q: "",
            groups: [],
        });

        expired = true;

        await fetcher.findkitFetch({
            searchEndpoint: "https://test.invalid/multi-search2",

            q: "",
            groups: [],
        });

        expect(spy).toBeCalledTimes(2);
    });
});
