import { describe, expect, it } from "vitest";
import { shipMissing } from "./shipReady";

const ready = { line: "Shipped it", links: [], images: 0, linkText: "" };

describe("what Ship is still missing", () => {
	it("asks for the line when it is empty", () => {
		expect(shipMissing({ ...ready, line: "  " })).toBe("line");
	});

	it("asks for a link or an image when there is none", () => {
		expect(shipMissing(ready)).toBe("link");
	});

	it("counts a typed link that was never added", () => {
		expect(shipMissing({ ...ready, linkText: "https://x.dev" })).toBeNull();
	});

	it("does not count typed text that is not a link", () => {
		expect(shipMissing({ ...ready, linkText: "not a url" })).toBe("link");
	});

	it("counts an added link", () => {
		expect(shipMissing({ ...ready, links: ["https://x.dev"] })).toBeNull();
	});

	it("counts an image", () => {
		expect(shipMissing({ ...ready, images: 1 })).toBeNull();
	});

	it("asks for the line first when both are missing", () => {
		expect(shipMissing({ ...ready, line: "" })).toBe("line");
	});
});
