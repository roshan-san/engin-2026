export type LoadingCache<T> = { key?: string; value?: T };

/**
 * A query's result that survives its args changing (a ticking clock): the last
 * result for the same `key` until the new one arrives, never another key's.
 */
export function keepWhileLoading<T>(
	cache: LoadingCache<T>,
	key: string,
	next: T | undefined,
): T | undefined {
	if (next !== undefined) {
		cache.key = key;
		cache.value = next;
		return next;
	}
	return cache.key === key ? cache.value : undefined;
}
