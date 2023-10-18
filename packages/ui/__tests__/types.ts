import { FindkitUI } from "../src/cdn-entries";
import { Filter } from "../src/filter-type";

function t(_desc: string, _test: Function) {
	// type only tests, not actually running this code
}

t("filter types", () => {
	function f(_: Filter) {}

	f({ ding: "value" });
	f({ ding: { $eq: "value" } });

	// @ts-expect-error
	f({ ding: { bad: "value" } });

	// @ts-expect-error
	f({ ding: { $bad: "value" } });

	// Should not really work...
	f({ ding: [{ ding: "value" }] });

	f({ $or: [{ ding: "value" }] });
	f({ $and: [{ ding: "value" }] });

	// @ts-expect-error
	f({ $or: 1 });

	// @ts-expect-error
	f({ $or: "" });

	// @ts-expect-error
	f({ $or: { key: "" } });
});

t("can add generic params to FindkitUI", () => {
	const ui = new FindkitUI<{
		params: {
			filter: {
				price: { $eq: number };
			};
		};
	}>({
		publicToken: "",

		params: {
			filter: {
				price: { $eq: 2 },
			},
		},
	});

	ui.updateParams((params) => {
		params.filter.price.$eq = 1;

		// @ts-expect-error
		params.filter.price.$eq = "bad";
	});

	const num: number = ui.params.filter.price.$eq;

	// @ts-expect-error
	const str: string = ui.params.filter.price.$eq;
});

t("generic params require matching initial param to FindkitUI", () => {
	const ui = new FindkitUI<{
		params: {
			filter: {
				price: { $eq: number };
			};
		};
	}>({
		publicToken: "",
		params: {
			filter: {
				// @ts-expect-error
				price: { $eq: "bad" },
			},
		},
	});
});

t("params is optional in the generic", () => {
	new FindkitUI<{}>({
		publicToken: "",
	});
});

t("generic params is constrained in FindkitUI", () => {
	// @ts-expect-error
	new FindkitUI<{
		params: {
			filter: {
				price: { $bad: number };
			};
		};
	}>({
		publicToken: "",
	});
});

t("custom router data", () => {
	const ui = new FindkitUI({ publicToken: "" });

	ui.customRouterData({
		init: {
			myData: "",
		},
		load(data) {
			// @ts-expect-error
			data.bad;

			// @ts-expect-error
			const num: number = data.myData;

			const str: string = data.myData;
		},

		save() {
			return {
				myData: "",
			};
		},
	});

	ui.customRouterData({
		init: {
			myData: "",
		},

		load() {},

		// Must match orignal init
		// @ts-expect-error
		save() {
			return {
				myData: -1,
			};
		},
	});

	// Only string keys are allowed
	ui.customRouterData({
		init: {
			// @ts-expect-error
			myData: -1,
		},

		load() {},

		// @ts-expect-error
		save() {
			return {
				myData: -1,
			};
		},
	});
});
