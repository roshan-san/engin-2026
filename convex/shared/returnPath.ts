/** A path on engin's own site: starts with one `/`, never `//` or `/\`, which browsers read as another host. */
export function isSafeReturnPath(path: string): boolean {
	return /^\/(?![/\\])/.test(path);
}
