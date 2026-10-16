import { describe, expect, it } from "vitest";
import { isSafeReturnPath } from "./returnPath";

describe("isSafeReturnPath", () => {
	it("a path inside engin is safe", () => {
		expect(isSafeReturnPath("/s/acme/hiring/abc?checkout=done")).toBe(true);
		expect(isSafeReturnPath("/")).toBe(true);
	});

	it("anything that could leave engin is not", () => {
		expect(isSafeReturnPath("//evil.com")).toBe(false);
		expect(isSafeReturnPath("https://evil.com")).toBe(false);
		expect(isSafeReturnPath("/\\evil.com")).toBe(false);
		expect(isSafeReturnPath("evil.com")).toBe(false);
		expect(isSafeReturnPath("")).toBe(false);
	});
});
