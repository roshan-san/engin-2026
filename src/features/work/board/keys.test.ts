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

	it("is false for Safari's composing Enter (keyCode 229)", () => {
		expect(
			isSendKey({
				key: "Enter",
				shiftKey: false,
				isComposing: false,
				keyCode: 229,
			}),
		).toBe(false);
	});

	it("is false for other keys", () => {
		expect(isSendKey({ key: "a", shiftKey: false, isComposing: false })).toBe(
			false,
		);
	});

	it("is false for a plain Enter on a touch screen, where Send is the button", () => {
		expect(
			isSendKey(
				{ key: "Enter", shiftKey: false, isComposing: false },
				{ coarse: true },
			),
		).toBe(false);
	});

	it("is still true for a plain Enter when the pointer is not coarse", () => {
		expect(
			isSendKey(
				{ key: "Enter", shiftKey: false, isComposing: false },
				{ coarse: false },
			),
		).toBe(true);
	});
});
