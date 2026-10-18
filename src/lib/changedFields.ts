/** The fields of `next` that differ from `saved`, for an update that sends only what changed. */
export function changedFields<T extends object>(next: T, saved: T): Partial<T> {
	const changed: Partial<T> = {};
	for (const key of Object.keys(next) as (keyof T)[]) {
		if (next[key] !== saved[key]) {
			changed[key] = next[key];
		}
	}
	return changed;
}
