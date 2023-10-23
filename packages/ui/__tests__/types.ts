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

t("can update partial params with ui.params", () => {
	const ui = new FindkitUI({ publicToken: "" });

	ui.updateParams({
		filter: {
			price: { $eq: 1 },
		},
	});
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

	// can replace with any valid SearchParams
	ui.updateParams({
		filter: {
			price: { $eq: "other" },
		},
	});

	ui.updateParams({
		filter: {
			price: {
				// @ts-expect-error
				$bad: "other",
			},
		},
	});

	const num: number = ui.params.filter.price.$eq;

	// @ts-expect-error
	const str: string = ui.params.filter.price.$eq;
});

t("can add generic sort params to FindkitUI", () => {
	const ui = new FindkitUI<{
		params: {
			sort: [
				{
					price: {
						$order: "asc" | "desc";
					};
				},
			];
		};
	}>({
		publicToken: "",
		params: {
			sort: [
				{
					price: {
						$order: "asc",
					},
				},
			],
		},
	});

	ui.updateParams((params) => {
		params.sort[0].price.$order = "asc";

		// @ts-expect-error
		params.sort[0].bad.$order = "asc";

		// @ts-expect-error
		params.sort[1].price.$order = "asc";
	});
});

t("sort type must be valid", () => {
	// @ts-expect-error
	new FindkitUI<{
		params: {
			sort: [
				{
					price: {
						$order: "bad";
					};
				},
			];
		};
	}>({
		publicToken: "",
	});
});

t("has default sort object", () => {
	const ui = new FindkitUI({ publicToken: "" });

	ui.updateParams((params) => {
		params.sort.foo;

		// @ts-expect-error
		const _bar: string = params.sort.foo;
	});

	ui.params.sort.foo;
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

t("groups have params object by default", () => {
	const ui = new FindkitUI({ publicToken: "" });
	ui.updateGroups((...groups) => {
		for (const group of groups) {
			group.params.lang = "en";
		}
	});

	ui.groups[0].params.lang?.toLowerCase();
});

t("can add generic groups to FindkitUI", () => {
	const ui = new FindkitUI<{
		groups: [
			{
				params: {
					filter: {
						price: { $eq: number };
					};
				};
			},
			{
				params: {
					filter: {
						price: { $eq: string };
					};
				};
			},
		];
	}>({
		publicToken: "",

		params: {
			filter: {
				price: { $eq: 2 },
			},
		},
	});

	ui.updateGroups((group1, group2) => {
		group1.params.filter.price.$eq = 1;
		group2.params.filter.price.$eq = "";

		// @ts-expect-error
		group1.params.filter.price.$eq = "";
		// @ts-expect-error
		group2.params.filter.price.$eq = 1;
	});

	// @ts-expect-error
	ui.updateGroups((group1, group2, extra) => {});

	ui.updateGroups((group1) => {});

	ui.updateGroups([{ params: { filter: { price: { $gt: 1 } } } }]);

	// @ts-expect-error
	ui.updateGroups([{ params: { filter: { price: { $bad: 1 } } } }]);
});

t("custom router data", () => {
	const ui = new FindkitUI({
		publicToken: "",
	});

	// @ts-expect-error
	ui.on("bad", () => {});

	ui.on("custom-router-data", (e) => {
		const str: string | undefined = e.data.ding;

		// @ts-expect-error
		const num: number = e.data.ding;
	});

	ui.setCustomRouterData({ something: "" });

	// @ts-expect-error
	ui.setCustomRouterData({ bad: 1 });
});

t("custom router data with generic constraint", () => {
	const ui = new FindkitUI<{
		customRouterData: {
			ding: string;
		};
	}>({
		publicToken: "",
		initialCustomRouterData: {
			ding: "",
		},
	});

	ui.setCustomRouterData({
		ding: "",
	});

	ui.setCustomRouterData({
		// @ts-expect-error
		dong: "bad",
	});

	ui.on("custom-router-data", (e) => {
		e.data.ding;

		const str: string = e.data.ding;

		// @ts-expect-error
		const num: number = e.data.ding;

		// @ts-expect-error
		e.data.bad;
	});
});
