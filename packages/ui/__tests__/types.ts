import { FindkitUI } from "../src/cdn-entries";
import { Filter } from "../src/filter-type";

function test_filter() {
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
}

function _customRouterData() {
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
}
