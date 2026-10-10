import { describe, expect, it } from "vitest";
import { groupMessages } from "./groupMessages";

const MINUTE = 60_000;
const fay = { _id: "fay" };
const sam = { _id: "sam" };

describe("groupMessages", () => {
	it("is empty for no messages", () => {
		expect(groupMessages([])).toEqual([]);
	});

	it("groups one author's messages within five minutes", () => {
		const first = { author: fay, at: 0 };
		const second = { author: fay, at: 4 * MINUTE };

		const groups = groupMessages([first, second]);

		expect(groups).toEqual([{ author: fay, at: 0, messages: [first, second] }]);
	});

	it("starts a new group after more than five minutes", () => {
		const first = { author: fay, at: 0 };
		const second = { author: fay, at: 6 * MINUTE };

		const groups = groupMessages([first, second]);

		expect(groups.map((group) => group.messages)).toEqual([[first], [second]]);
	});

	it("measures the gap from the group's last message", () => {
		const messages = [0, 4, 8].map((minutes) => ({
			author: fay,
			at: minutes * MINUTE,
		}));

		const groups = groupMessages(messages);

		expect(groups).toHaveLength(1);
	});

	it("starts a new group when the author changes", () => {
		const first = { author: fay, at: 0 };
		const second = { author: sam, at: MINUTE };

		const groups = groupMessages([first, second]);

		expect(groups.map((group) => group.author)).toEqual([fay, sam]);
	});
});
