import { describe, expect, it } from "vitest";
import { homeSections } from "./homeSections";

const none = { startups: [], building: [], applied: [] };
const application = { hackathonId: "h" };
const startup = { startupId: "s" };

describe("homeSections", () => {
	it("a brand-new account sees the two ways in and no applications", () => {
		expect(homeSections(none)).toEqual({
			welcome: true,
			applications: false,
		});
	});

	it("someone who has only applied sees the two ways in and their applications", () => {
		expect(homeSections({ ...none, applied: [application] })).toEqual({
			welcome: true,
			applications: true,
		});
	});

	it("a Startup member sees their places, not the welcome", () => {
		expect(homeSections({ ...none, startups: [startup] })).toEqual({
			welcome: false,
			applications: false,
		});
	});

	it("a Builder with an application sees both", () => {
		expect(
			homeSections({
				...none,
				building: [{ hackathonId: "b" }],
				applied: [application],
			}),
		).toEqual({ welcome: false, applications: true });
	});
});
