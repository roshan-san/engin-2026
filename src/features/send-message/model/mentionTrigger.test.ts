import { describe, expect, it } from "vitest";
import { findTrigger } from "./mentionTrigger";

describe("findTrigger", () => {
	it("finds a #query typed after a space", () => {
		expect(findTrigger("hi #fix", 7)).toEqual({ start: 3, query: "fix" });
	});

	it("finds a bare # with an empty query", () => {
		expect(findTrigger("#", 1)).toEqual({ start: 0, query: "" });
	});

	it("ignores a # that is not at the start or after whitespace", () => {
		expect(findTrigger("a#b", 3)).toBeNull();
	});

	it("ignores a # when the caret is past a space", () => {
		expect(findTrigger("#fix done", 9)).toBeNull();
	});

	it("finds the #query when the caret is inside it", () => {
		expect(findTrigger("#fix done", 4)).toEqual({ start: 0, query: "fix" });
	});
});
