import { describe, expect, it } from "vitest";
import { isSendKey, shouldIgnoreShortcut } from "./keys";

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

	it("is true for Cmd+Enter or Ctrl+Enter on a touch screen, for a hardware keyboard", () => {
		const enter = { key: "Enter", shiftKey: false, isComposing: false };
		expect(isSendKey({ ...enter, metaKey: true }, { coarse: true })).toBe(true);
		expect(isSendKey({ ...enter, ctrlKey: true }, { coarse: true })).toBe(true);
	});

	it("is false for Cmd+Enter while an IME is composing, even on a touch screen", () => {
		expect(
			isSendKey(
				{ key: "Enter", shiftKey: false, isComposing: true, metaKey: true },
				{ coarse: true },
			),
		).toBe(false);
	});
});

describe("shouldIgnoreShortcut", () => {
	function element(tagName: string, insideRole?: string) {
		return {
			tagName,
			isContentEditable: false,
			closest: () => (insideRole ? {} : null),
		} as unknown as EventTarget;
	}
	const plain = {
		defaultPrevented: false,
		ctrlKey: false,
		metaKey: false,
		altKey: false,
		target: element("DIV"),
	};

	it("lets a plain key on the page through", () => {
		expect(shouldIgnoreShortcut(plain)).toBe(false);
	});

	it("lets a key with no element target through", () => {
		expect(shouldIgnoreShortcut({ ...plain, target: null })).toBe(false);
	});

	it("ignores a key something else already handled", () => {
		expect(shouldIgnoreShortcut({ ...plain, defaultPrevented: true })).toBe(
			true,
		);
	});

	it("ignores a key with a modifier held", () => {
		expect(shouldIgnoreShortcut({ ...plain, ctrlKey: true })).toBe(true);
		expect(shouldIgnoreShortcut({ ...plain, metaKey: true })).toBe(true);
		expect(shouldIgnoreShortcut({ ...plain, altKey: true })).toBe(true);
	});

	it("ignores typing in an input, a textarea or editable text", () => {
		expect(shouldIgnoreShortcut({ ...plain, target: element("INPUT") })).toBe(
			true,
		);
		expect(
			shouldIgnoreShortcut({ ...plain, target: element("TEXTAREA") }),
		).toBe(true);
		const editable = {
			...element("DIV"),
			isContentEditable: true,
		} as unknown as EventTarget;
		expect(shouldIgnoreShortcut({ ...plain, target: editable })).toBe(true);
	});

	it("ignores a key inside a dialog, list or menu", () => {
		expect(
			shouldIgnoreShortcut({ ...plain, target: element("BUTTON", "dialog") }),
		).toBe(true);
	});
});
