import { describe, expect, it } from "vitest";
import { pickImages } from "./images";

const file = (name: string, type: string) => new File(["x"], name, { type });

describe("pickImages", () => {
	it("keeps images and skips other files", () => {
		const png = file("a.png", "image/png");
		const pdf = file("b.pdf", "application/pdf");
		const jpg = file("c.jpg", "image/jpeg");

		const result = pickImages([png, pdf, jpg], 5);

		expect(result.accepted).toEqual([png, jpg]);
		expect(result.skipped).toBe(1);
	});

	it("keeps only as many images as there is room for", () => {
		const files = [
			file("a.png", "image/png"),
			file("b.png", "image/png"),
			file("c.png", "image/png"),
		];

		const result = pickImages(files, 2);

		expect(result.accepted).toEqual(files.slice(0, 2));
		expect(result.skipped).toBe(1);
	});

	it("accepts nothing when there is no room", () => {
		const result = pickImages([file("a.png", "image/png")], 0);

		expect(result.accepted).toEqual([]);
		expect(result.skipped).toBe(1);
	});
});
