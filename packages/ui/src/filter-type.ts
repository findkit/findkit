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
