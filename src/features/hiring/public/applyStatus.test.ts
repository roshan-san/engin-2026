import { describe, expect, it } from "vitest";
import {
	APPLY_COPY,
	type ApplyState,
	answerKey,
	applyBarAction,
	applyPanelTitle,
	applyState,
	closedLabel,
} from "./applyStatus";

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
		const withStatus = (status: "applied" | "participating" | "declined") => ({
			status: "live" as const,
			isTeam: false,
			myApplication: { status },
		});

		expect(applyState(withStatus("applied"), true)).toBe("applied");
		expect(applyState(withStatus("participating"), true)).toBe("participating");
		expect(applyState(withStatus("declined"), true)).toBe("declined");
	});

	it("a Hackathon that isn't open is closed to new applicants", () => {
		for (const status of ["live", "deciding", "done"] as const) {
			expect(applyState({ ...open, status }, true)).toBe("closed");
			expect(applyState({ ...open, status }, false)).toBe("closed");
		}
	});
});

describe("copy", () => {
	it("says where you stand", () => {
		expect(APPLY_COPY.participating).toBe("You're in.");
		expect(APPLY_COPY.declined).toBe("Not this time. Thanks for applying.");
	});

	it("names a closed Hackathon", () => {
		expect(closedLabel("live")).toBe("Live now");
		expect(closedLabel("deciding")).toBe("Deciding");
		expect(closedLabel("done")).toBe("Finished");
	});

	it("says Applied once the answer is sent", () => {
		expect(APPLY_COPY.applied).toBe("Applied.");
	});

	it("keeps each answer under its own key", () => {
		expect(answerKey("h1")).toBe("engin:apply:h1");
	});
});

describe("applyBarAction", () => {
	it("people who can apply see Apply", () => {
		for (const state of ["form", "sign_in"] as const) {
			expect(applyBarAction(state)).toEqual({ kind: "panel", label: "Apply" });
		}
	});

	it("people who applied see Your application", () => {
		for (const state of ["applied", "declined"] as const) {
			expect(applyBarAction(state)).toEqual({
				kind: "panel",
				label: "Your application",
			});
		}
	});

	it("a Participant is sent to their Board", () => {
		expect(applyBarAction("participating")).toEqual({ kind: "board" });
	});

	it("a closed Hackathon and the Startup's own team get no button", () => {
		const none: ApplyState[] = ["closed", "team"];
		for (const state of none) {
			expect(applyBarAction(state)).toBeNull();
		}
	});
});

describe("applyPanelTitle", () => {
	it("the panel is titled for what it holds", () => {
		expect(applyPanelTitle("form")).toBe("Apply");
		expect(applyPanelTitle("sign_in")).toBe("Apply");
		expect(applyPanelTitle("applied")).toBe("Your application");
		expect(applyPanelTitle("declined")).toBe("Your application");
		expect(applyPanelTitle("participating")).toBe("Details");
		expect(applyPanelTitle("closed")).toBe("Details");
		expect(applyPanelTitle("team")).toBe("Details");
	});
});
