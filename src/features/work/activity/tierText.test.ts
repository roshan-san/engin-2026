import { describe, expect, it } from "vitest";
import { tierText } from "./tierText";

describe("tierText", () => {
	it("colours a Rating with its Tier's text colour", () => {
		expect(tierText(980)).toBe("text-tier-1");
		expect(tierText(1000)).toBe("text-tier-2");
		expect(tierText(1200)).toBe("text-tier-3");
		expect(tierText(1300)).toBe("text-tier-4");
		expect(tierText(1500)).toBe("text-tier-5");
	});
});
