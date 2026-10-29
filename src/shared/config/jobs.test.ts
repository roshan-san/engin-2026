import { describe, expect, it } from "vitest";
import { jobLine } from "./jobs";

describe("jobLine", () => {
	it("reads role, pay and mode", () => {
		expect(jobLine({ role: "fullstack", pay: "9_15l", mode: "onsite" })).toBe(
			"Full-stack · ₹9–15 L · On-site",
		);
	});
});
