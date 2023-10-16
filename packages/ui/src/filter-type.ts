/**
 * @public
 **/
export interface Filter {
	[key: string]: Operator | Filter[] | undefined;
	$or?: Filter[];
	$and?: Filter[];
}

type Operator =
	| string // implicit $eq
	| number // implicit $eq
	| { $eq: string | number }
	| { $ne: string | number }
	| { $gt: number | string }
	| { $gte: number | string }
	| { $lt: number | string }
	| { $lte: number | string }
	| { $all: string[] }
	| { $in: string[] };

function _test() {
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
