# Operators

Operators available for the [`filter` search param](/ui/api/params#filter)

### `$eq` {#$eq}

Equality filter. Works with all field types. If used with the `tags` field it
will match if any of the tags in the document equal with the `$eq` value.

Example

```json
{
	"field": {
		"$eq": "value"
	}
}
```

String value is an implicit `$eq`. Eg. this can written as

```json
{
	"field": "value"
}
```

### `$gt` {#$gt}

"Greater than". Works with `created`, `modified` and custom fields with
`number` or `date` type.

```json
{
	"stock": {
		"$gt": 0
	}
}
```

### `$gte` {#$gte}

"Greater than or equal" version of [`$gt`](#$gt)

### `$lt` {#$lt}

"Less than" version of [`$gt`](#$gt)

### `$lte` {#$lte}

"Less than or equal" version of [`$gt`](#$gt)

### `$in` {#$in}

Matches if any of the provided values match with the document values

```json
{
	"category": {
		"$in": ["kitchen", "furniture"]
	}
}
```

Desugars to [`$or`](#$or)

```json
{
	"$or": [
		{ "category": { "$eq": "kitchen" } },
		{ "category": { "$eq": "furniture" } }
	]
}
```

If used with `tags` it matches if at least one document tag matches with provided values.

### `$all` {#$all}

Works only with `tags`. Matches when all tags are found in the document.

```json
{
	"tags": {
		"$all": ["product", "country/finland"]
	}
}
```

Desugars to [`$and`](#$and)

```json
{
	"$and": [{ "tags": { "$eq": "kitchen" } }, { "tags": { "$eq": "furniture" } }]
}
```

### `$not` {#$not}

Negates the condition.

Example: Match pages that do not have tag "foo"

```json
{
	"$not": {
		"tags": "foo"
	}
}
```

### `$or` {#$or}

Create `OR` condition with an array. Matches when at least one of the
conditions in the given array match.

```json
{
	"$or": [
		{ "category": { "$eq": "kitchen" } },
		{ "category": { "$eq": "furniture" } }
	]
}
```

### `$and` {#$and}

Create `AND` condition with an array. Matches when all the conditions match in the array.

```json
{
	"$and": [{ "tags": "product" }, { "category": "furniture" }]
}
```

Objects create implicit `AND` conditions so this could be written as

```json
{
	"country": "finland",
	"category": "furniture"
}
```

Explicit `AND` is required when using multiple operators on the same field:

```json
{
	"$and": [{ "price": { "$gt": 100 } }, { "price": { "$lt": 200 } }]
}
```
