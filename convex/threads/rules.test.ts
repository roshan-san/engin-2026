import { describe, expect, it } from "vitest";
import { isThreadOpen, PRIVATE_THREAD_GRACE_MS } from "./rules";

const FINISHED_AT = 1_000;
const done = { status: "done", finishedAt: FINISHED_AT } as const;

describe("isThreadOpen", () => {
	it("a running Hackathon's threads are open", () => {
		expect(isThreadOpen("everyone", { status: "deciding" }, 0)).toBe(true);
		expect(isThreadOpen("private", { status: "live" }, 0)).toBe(true);
	});

	it("Everyone locks as soon as the Hackathon is done", () => {
		expect(isThreadOpen("everyone", done, FINISHED_AT)).toBe(false);
	});

	it("a private thread stays open until the grace ends", () => {
		const end = FINISHED_AT + PRIVATE_THREAD_GRACE_MS;

		expect(isThreadOpen("private", done, end - 1)).toBe(true);
		expect(isThreadOpen("private", done, end)).toBe(false);
	});

	it("a Hackathon finished before finishedAt existed stays locked", () => {
		expect(isThreadOpen("private", { status: "done" }, 0)).toBe(false);
	});

	it("a Team thread never locks", () => {
		expect(isThreadOpen("team", done, FINISHED_AT * 2)).toBe(true);
	});
});
