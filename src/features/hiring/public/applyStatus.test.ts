import { describe, expect, it } from "vitest";
import { APPLY_COPY, answerKey, applyState, closedLabel } from "./applyStatus";

const open = { status: "open" as const, isTeam: false, myApplication: null };

describe("applyState", () => {
	it("signed out on an open Hackathon, sign in first", () => {
		expect(applyState(open, false)).toBe("sign_in");
	});

	it("the Startup's team can't apply", () => {
		expect(applyState({ ...open, isTeam: true }, true)).toBe("team");
	});

	it("signed in with no application, the form shows", () => {
		expect(applyState(open, true)).toBe("form");
	});

	it("an application shows its status, whatever the Hackathon's", () => {
		const withStatus = (
			status: "applied" | "building" | "declined" | "left",
		) => ({
			status: "building" as const,
			isTeam: false,
			myApplication: { status },
		});

		expect(applyState(withStatus("applied"), true)).toBe("applied");
		expect(applyState(withStatus("building"), true)).toBe("building");
		expect(applyState(withStatus("declined"), true)).toBe("declined");
		expect(applyState(withStatus("left"), true)).toBe("declined");
	});

	it("a Hackathon that isn't open is closed to new applicants", () => {
		for (const status of ["building", "deciding", "done"] as const) {
			expect(applyState({ ...open, status }, true)).toBe("closed");
			expect(applyState({ ...open, status }, false)).toBe("closed");
		}
	});
});

describe("copy", () => {
	it("says where you stand", () => {
		expect(APPLY_COPY.applied).toBe("Sent. You'll hear before it starts.");
		expect(APPLY_COPY.building).toBe("You're in.");
		expect(APPLY_COPY.declined).toBe("Not this time. Thanks for applying.");
	});

	it("names a closed Hackathon", () => {
		expect(closedLabel("building")).toBe("Building now");
		expect(closedLabel("deciding")).toBe("Finished");
		expect(closedLabel("done")).toBe("Finished");
	});

	it("keeps each answer under its own key", () => {
		expect(answerKey("h1")).toBe("engin:apply:h1");
	});
});
