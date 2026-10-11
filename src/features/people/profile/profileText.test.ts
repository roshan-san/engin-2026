import { describe, expect, it } from "vitest";
import {
	disciplineLabel,
	hackathonLine,
	outcomeLabel,
	workLine,
} from "./profileText";

const acme = { name: "Acme", slug: "acme" };

describe("profileText", () => {
	it("a Hackathon row names the outcome, job and Startup", () => {
		expect(
			hackathonLine({
				outcome: "hired",
				job: { role: "frontend" },
				startup: acme,
			}),
		).toBe("Hired · Frontend at Acme");
	});

	it("Built is the plain outcome", () => {
		expect(outcomeLabel("built")).toBe("Built");
	});

	it("verified work counts Cards per Startup", () => {
		expect(workLine({ startup: acme, count: 1, capped: false })).toBe(
			"1 card at Acme",
		);
		expect(workLine({ startup: acme, count: 38, capped: false })).toBe(
			"38 cards at Acme",
		);
		expect(workLine({ startup: acme, count: 500, capped: true })).toBe(
			"500+ cards at Acme",
		);
	});

	it("a discipline reads as its label", () => {
		expect(disciplineLabel("engineer")).toBe("Engineer");
	});
});
