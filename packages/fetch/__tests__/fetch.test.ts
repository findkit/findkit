import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { rest } from "msw";
import { sign } from "jsonwebtoken";

import fetch from "node-fetch";

import { setupServer } from "msw/node";
import {
	createFindkitFetcher,
	FindkitSearchResponse,
	FindkitErrorResponse,
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

describe("fetch", () => {
	test("empty fetch", async () => {
		const { fetch: findkitFetch } = createFindkitFetcher({
			searchEndpoint: "https://test.invalid/multi-search2",
		});

		server.use(
			rest.post("https://test.invalid/multi-search2", (req, res, ctx) => {
				const resData: FindkitSearchResponse = {
					groups: [],
					duration: 123,
				};
				return res(ctx.json(resData));
			})
		);

		const res = await findkitFetch({
			terms: "",
			groups: [],
		});

		expect(res).toEqual({ duration: 123, groups: [] });
	});

	test("can use publicToken to generate the endpoint", async () => {
		const spy = vi.fn();

		const { fetch: findkitFetch } = createFindkitFetcher({
			publicToken: "thetoken",
		});

		server.use(
			rest.post(
				"https://search.findkit.com/c/thetoken/search",
				(req, res, ctx) => {
					spy(req.url.toString());
					const resData: FindkitSearchResponse = {
						groups: [],
						duration: 123,
					};
					return res(ctx.json(resData));
				}
			)
		);

		const res = await findkitFetch({
			terms: "",
			groups: [],
		});

		expect(res).toEqual({ duration: 123, groups: [] });
		expect(spy).toHaveBeenCalledWith(
			"https://search.findkit.com/c/thetoken/search?p=thetoken"
		);
	});

	test("when no groups are defined add a default that searches everything", async () => {
		const { fetch: findkitFetch } = createFindkitFetcher({
			searchEndpoint: "https://test.invalid/multi-search2",
		});

		server.use(
			rest.post("https://test.invalid/multi-search2", async (req, res, ctx) => {
				const requestBody = await req.json();
				expect(requestBody).toEqual({ q: "test", groups: [{ tagQuery: [] }] });

				const resData: FindkitSearchResponse = {
					groups: [],
					duration: 123,
				};
				return res(ctx.json(resData));
			})
		);
		const res = await findkitFetch({
			terms: "test",
		});

		expect(res).toEqual({ duration: 123, groups: [] });
	});

	describe("jwt", () => {
		test("calls getJwtToken() and passes the token in the p query string", async () => {
			const spy = vi.fn();

			server.use(
				rest.post("https://test.invalid/multi-search2", (req, res, ctx) => {
					spy(req.url.searchParams.get("p"));

					const resData: FindkitSearchResponse = {
						groups: [],
						duration: 123,
					};
					return res(ctx.json(resData));
				})
			);

			const { fetch: findkitFetch } = createFindkitFetcher({
				searchEndpoint: "https://test.invalid/multi-search2",
				async getJwtToken() {
					return { jwt };
				},
			});

			const jwt = createJwtToken();

			const res = await findkitFetch({
				terms: "",
				groups: [],
			});

			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith("jwt:" + jwt);
			expect(res).toEqual({ duration: 123, groups: [] });
		});

		test("calls getJwtToken() only once for multiple fetches", async () => {
			const spy = vi.fn();

			server.use(
				rest.post("https://test.invalid/multi-search2", (req, res, ctx) => {
					const resData: FindkitSearchResponse = {
						groups: [],
						duration: 123,
					};
					return res(ctx.json(resData));
				})
			);

			const fetcher = createFindkitFetcher({
				searchEndpoint: "https://test.invalid/multi-search2",
				async getJwtToken() {
					spy();
					return { jwt };
				},
			});

			const jwt = createJwtToken();

			for await (const i of Array(5).keys()) {
				await fetcher.fetch({
					terms: i.toString(),
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
						const data: FindkitErrorResponse = {
							code: "jwt-expired",
						};
						return res(ctx.status(403), ctx.json(data));
					}

					const resData: FindkitSearchResponse = {
						groups: [],
						duration: 123,
					};
					return res(ctx.json(resData));
				})
			);

			const spy = vi.fn();

			const fetcher = createFindkitFetcher({
				searchEndpoint: "https://test.invalid/multi-search2",
				async getJwtToken() {
					spy();
					const jwt = createJwtToken();
					return { jwt };
				},
			});

			await fetcher.fetch({
				terms: "",
				groups: [],
			});

			expired = true;

			await fetcher.fetch({
				terms: "",
				groups: [],
			});

			expect(spy).toBeCalledTimes(2);
		});
	});
});
