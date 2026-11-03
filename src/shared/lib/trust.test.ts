import { describe, expect, it } from "vitest";
import { trustLabel, trustLines } from "./trust";

const progress = (
	p: Partial<Parameters<typeof trustLines>[0]["progress"]>,
) => ({
	weeks: 0,
	highWeeks: 0,
	highStartups: 0,
	hackathon: false,
	...p,
});

describe("trust", () => {
	it("labels each level", () => {
		expect(trustLabel("low")).toBe("Low");
		expect(trustLabel("mid")).toBe("Mid");
		expect(trustLabel("high")).toBe("High");
	});

	it("Low says what Mid needs and how far along you are", () => {
		expect(
			trustLines({
				trust: "low",
				held: false,
				progress: progress({ weeks: 3 }),
			}),
		).toEqual({
			now: "Low: your Record isn't confirmed by others yet.",
			next: "Mid: others approve your work in 4 different weeks (3 of 4), or finish a paid Hackathon where the promise was kept.",
		});
	});

	it("Mid names the rule met and what High needs", () => {
		const next =
			"High: approval from Mid or High people at 2 unrelated startups (1 of 2), across 12 different weeks (5 of 12).";

		expect(
			trustLines({
				trust: "mid",
				held: false,
				progress: progress({ weeks: 6, highWeeks: 5, highStartups: 1 }),
			}),
		).toEqual({
			now: "Mid: others approved your work in 4 different weeks.",
			next,
		});
		expect(
			trustLines({
				trust: "mid",
				held: false,
				progress: progress({ hackathon: true, highWeeks: 5, highStartups: 1 }),
			}),
		).toEqual({
			now: "Mid: you finished a paid Hackathon where the promise was kept.",
			next,
		});
	});

	it("High has nothing next", () => {
		expect(
			trustLines({
				trust: "high",
				held: false,
				progress: progress({ weeks: 14, highWeeks: 12, highStartups: 2 }),
			}).next,
		).toBeNull();
	});

	it("a held Trust says it's on hold", () => {
		expect(
			trustLines({ trust: "mid", held: true, progress: progress({ weeks: 4 }) })
				.now,
		).toMatch(/ It's on hold while we review your Record\.$/);
	});
});
