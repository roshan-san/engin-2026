import { useState } from "react";

/**
 * The last loaded value for `key`: keeps a query's old result on screen while
 * it reloads with new args (e.g. one more page). A new `key` starts empty.
 */
export function useKept<T>(value: T | undefined, key: string | undefined) {
	const [kept, setKept] = useState({ key, value });
	if (value !== undefined && (value !== kept.value || key !== kept.key)) {
		setKept({ key, value });
	}
	if (value !== undefined) return value;
	return kept.key === key ? kept.value : undefined;
}
