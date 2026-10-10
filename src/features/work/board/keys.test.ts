import { describe, expect, it } from "vitest";
import { isSendKey } from "./keys";

describe("isSendKey", () => {
	it("is true for a plain Enter", () => {
		expect(
			isSendKey({ key: "Enter", shiftKey: false, isComposing: false }),
		).toBe(true);
	});

	it("is false with Shift held", () => {
		expect(
			isSendKey({ key: "Enter", shiftKey: true, isComposing: false }),
		).toBe(false);
	});

	it("is false while an IME is composing", () => {
		expect(
			isSendKey({ key: "Enter", shiftKey: false, isComposing: true }),
		).toBe(false);
	});

	it("is false for other keys", () => {
		expect(isSendKey({ key: "a", shiftKey: false, isComposing: false })).toBe(
			false,
		);
	});
});
