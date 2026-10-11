import { describe, expect, it } from "vitest";
import { myHackathonStatus } from "./hackathonStatus";

describe("myHackathonStatus", () => {
	it("an application waiting opens the public page", () => {
		expect(myHackathonStatus({ status: "applied", decision: null })).toEqual({
			label: "Applied",
			to: "/hackathons/$id",
		});
	});

	it("declined or left reads as not this time", () => {
		for (const status of ["declined", "left"] as const) {
			expect(myHackathonStatus({ status, decision: null })).toEqual({
				label: "Not this time",
				to: "/hackathons/$id",
			});
		}
	});

	it("a Builder opens their Board", () => {
		expect(myHackathonStatus({ status: "building", decision: null })).toEqual({
			label: "Building",
			to: "/h/$id",
		});
		expect(
			myHackathonStatus({ status: "building", decision: "hired" }),
		).toEqual({ label: "Hired", to: "/h/$id" });
		expect(
			myHackathonStatus({ status: "building", decision: "not_this_time" }),
		).toEqual({ label: "Decided", to: "/h/$id" });
	});
});
