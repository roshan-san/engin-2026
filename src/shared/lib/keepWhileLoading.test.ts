import { describe, expect, it } from "vitest";
import { keepWhileLoading, type LoadingCache } from "./keepWhileLoading";

describe("keepWhileLoading", () => {
	it("keeps the last result while the same query reloads with new args", () => {
		const cache: LoadingCache<string> = {};

		expect(keepWhileLoading(cache, "acme", "first")).toBe("first");
		expect(keepWhileLoading(cache, "acme", undefined)).toBe("first");
		expect(keepWhileLoading(cache, "acme", "second")).toBe("second");
	});

	it("never shows another key's result", () => {
		const cache: LoadingCache<string> = {};
		keepWhileLoading(cache, "acme", "acme's");

		expect(keepWhileLoading(cache, "globex", undefined)).toBeUndefined();
	});
});
