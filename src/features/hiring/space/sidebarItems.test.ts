import { describe, expect, it } from "vitest";
import { resolveView, type SidebarInput, sidebarItems } from "./sidebarItems";

function builder(id: string, shortlisted = false) {
	return {
		application: {
			_id: `app-${id}`,
			status: "building",
			shortlisted,
			decision: null,
		},
		user: { _id: id, name: id.toUpperCase(), username: null, image: null },
	};
}

const input = {
	builders: [builder("ana", true), builder("ben")],
	queue: [
		{ owner: { _id: "ana" } },
		{ owner: { _id: "ana" } },
		{ owner: { _id: "ben" } },
	],
	threads: [
		{ _id: "t-everyone", kind: "everyone", builder: null, unread: true },
		{ _id: "t-ana", kind: "private", builder: { _id: "ana" }, unread: false },
		{ _id: "t-ben", kind: "private", builder: { _id: "ben" }, unread: true },
	],
} as unknown as SidebarInput;

describe("sidebarItems", () => {
	it("counts the review queue, overall and per Builder", () => {
		const items = sidebarItems(input);

		expect(items.reviewCount).toBe(3);
		expect(
			items.builders.map((b) => [b.userId, b.reviewCount, b.shortlisted]),
		).toEqual([
			["ana", 2, true],
			["ben", 1, false],
		]);
	});

	it("marks unread threads", () => {
		const items = sidebarItems(input);

		expect(items.everyoneUnread).toBe(true);
		expect(items.builders.map((b) => [b.userId, b.unread])).toEqual([
			["ana", false],
			["ben", true],
		]);
	});
});

describe("resolveView", () => {
	const builderIds = ["ana", "ben"];

	it("keeps a view that still exists", () => {
		expect(resolveView("everyone", builderIds, "building")).toBe("everyone");
		expect(resolveView("ben", builderIds, "deciding")).toBe("ben");
	});

	it("falls back when the view is gone or was never set", () => {
		expect(resolveView("app-123", builderIds, "building")).toBe("review");
		expect(resolveView(undefined, builderIds, "building")).toBe("review");
		expect(resolveView("zed", builderIds, "deciding")).toBe("ana");
		expect(resolveView(undefined, [], "done")).toBe("review");
	});
});
