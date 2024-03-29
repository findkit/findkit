/**
 * @public
 *
 * New in v0.9.0
 **/
export type Filter = {
	[key: string]:
		| Operator
		| string // implicit $eq
		| number // implicit $eq
		| Filter[]
		| undefined;
	$or?: Filter[];
	$and?: Filter[];
};

/**
 *
 * Operator type for a filter. $eq, $gt, $gte, $lt, $lte, $all, $in, $ne etc..
 *
 * New in v0.9.0
 *
 * @public
 */
export type Operator =
	| { $eq: string | number }
	| { $ne: string | number }
	| { $gt: number | string }
	| { $gte: number | string }
	| { $lt: number | string }
	| { $lte: number | string }
	| { $all: string[] }
	| { $in: string[] };
