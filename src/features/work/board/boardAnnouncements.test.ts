import type {
	DragEndEvent,
	DragOverEvent,
	DragStartEvent,
} from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import { boardAnnouncements } from "./boardAnnouncements";

const titles: Record<string, string> = { c1: "Fix login" };
const labels: Record<string, string> = { review: "Review", todo: "To do" };

function announcements(
	isAccepted?: (cardId: string, columnId: string) => boolean,
) {
	return boardAnnouncements(
		(id) => titles[id] ?? "a Card",
		(id) => labels[id] ?? id,
		isAccepted,
	);
}

const active = { id: "c1" };

describe("the Board's screen-reader announcements", () => {
	it("names the Card that was picked up", () => {
		expect(
			announcements().onDragStart?.({ active } as unknown as DragStartEvent),
		).toBe("Picked up Fix login");
	});

	it("says which column the Card is over", () => {
		expect(
			announcements().onDragOver?.({
				active,
				over: { id: "review" },
			} as unknown as DragOverEvent),
		).toBe("Fix login is over Review");
	});

	it("says the Card moved to the column it was dropped on", () => {
		expect(
			announcements().onDragEnd?.({
				active,
				over: { id: "review" },
			} as unknown as DragEndEvent),
		).toBe("Fix login moved to Review");
	});

	it("says nothing moved when the Card is dropped outside every column", () => {
		expect(
			announcements().onDragEnd?.({
				active,
				over: null,
			} as unknown as DragEndEvent),
		).toBe("Fix login dropped. Nothing moved.");
	});

	it("says nothing moved when the column refuses the Card", () => {
		expect(
			announcements(() => false).onDragEnd?.({
				active,
				over: { id: "review" },
			} as unknown as DragEndEvent),
		).toBe("Fix login dropped. Nothing moved.");
	});

	it("says the Card stayed put when the drag is cancelled", () => {
		expect(
			announcements().onDragCancel?.({ active } as unknown as DragEndEvent),
		).toBe("Cancelled. Fix login stayed put.");
	});
});
