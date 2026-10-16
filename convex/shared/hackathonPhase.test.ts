import { describe, expect, it } from "vitest";
import {
	type HackathonPhase,
	isRunning,
	isUnderway,
	phaseOf,
} from "./hackathonPhase";

const endsAt = 1_000_000;

describe("phaseOf", () => {
	it.each<[HackathonPhase, HackathonPhase, HackathonPhase]>([
		["draft", "draft", "draft"],
		["open", "open", "open"],
		["live", "live", "deciding"],
		["deciding", "deciding", "deciding"],
		["done", "done", "done"],
	])(
		"a %s Hackathon is %s before it ends and %s after",
		(status, before, after) => {
			expect(phaseOf({ status, endsAt }, endsAt - 1)).toBe(before);
			expect(phaseOf({ status, endsAt }, endsAt)).toBe(after);
		},
	);
});

describe("running and underway", () => {
	it.each<[HackathonPhase, boolean, boolean]>([
		["draft", false, false],
		["open", true, false],
		["live", true, true],
		["deciding", true, true],
		["done", false, false],
	])("a %s Hackathon: running %s, underway %s", (phase, running, underway) => {
		expect(isRunning(phase)).toBe(running);
		expect(isUnderway(phase)).toBe(underway);
	});
});
