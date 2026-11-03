import { describe, expect, it } from "vitest";
import { proofHint } from "./proofHint";

describe("proofHint", () => {
	it("asks each discipline for its own kind of proof", () => {
		expect(proofHint("developer")).toBe(
			"Link the pull request or the live page.",
		);
		expect(proofHint("designer")).toBe(
			"Link the design file or add a screenshot.",
		);
		expect(proofHint("marketing")).toBe(
			"Link the post or campaign, and add the numbers.",
		);
		expect(proofHint("sales")).toBe("Say who said yes, and to what.");
	});

	it("other and unknown get the general hint", () => {
		expect(proofHint("other")).toBe("Link it, or add a screenshot.");
		expect(proofHint(null)).toBe("Link it, or add a screenshot.");
	});
});
