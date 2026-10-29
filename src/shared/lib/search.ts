/** The chip value, or nothing when the URL carries something else. */
export function pickChip<T extends string>(
	chips: readonly { readonly value: T }[],
	raw: unknown,
): T | undefined {
	return chips.find((chip) => chip.value === raw)?.value;
}

/** True when any filter is on. The parsers set every key, so an off filter is a key holding `undefined`. */
export function hasFilters(search: object): boolean {
	return Object.values(search).some((value) => value !== undefined);
}
