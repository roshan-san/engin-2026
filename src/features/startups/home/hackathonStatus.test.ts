import { describe, expect, it } from "vitest";
import { myHackathonStatus } from "./hackathonStatus";

describe("myHackathonStatus", () => {
	it("an application waiting opens the public page", () => {
		expect(
			myHackathonStatus({
				status: "applied",
				decision: null,
				hackathonStatus: "open",
			}),
		).toEqual({
			label: "Applied",
			to: "/hackathons/$id",
		});
	});

	it("declined or left reads as not this time", () => {
		for (const status of ["declined", "left"] as const) {
			expect(
				myHackathonStatus({ status, decision: null, hackathonStatus: "open" }),
			).toEqual({
				label: "Not this time",
				to: "/hackathons/$id",
			});
		}
	});

	it("a Builder opens their Board", () => {
		const builder = (
			hackathonStatus: "open" | "building" | "deciding" | "done",
		) =>
			myHackathonStatus({ status: "building", decision: null, hackathonStatus })
				.label;

		expect(builder("open")).toBe("Accepted");
		expect(builder("building")).toBe("Building");
		expect(builder("deciding")).toBe("Waiting");
		expect(builder("done")).toBe("No decision");
		expect(
			myHackathonStatus({
				status: "building",
				decision: "hired",
				hackathonStatus: "done",
			}),
		).toEqual({ label: "Hired", to: "/h/$id" });
		expect(
			myHackathonStatus({
				status: "building",
				decision: "not_this_time",
				hackathonStatus: "done",
			}),
		).toEqual({ label: "Decided", to: "/h/$id" });
	});
});
