import { describe, expect, it } from "vitest";
import { mentionToken, parseMentions, splitBody } from "./mentions";

describe("mentions", () => {
	it("a mention is #card: and the Card id", () => {
		expect(mentionToken("abc")).toBe("#card:abc");
	});

	it("each Card is listed once, in order of first mention", () => {
		const ids = parseMentions("see #card:abc and #card:def, again #card:abc");

		expect(ids).toEqual(["abc", "def"]);
	});

	it("a bare #card: is not a mention", () => {
		expect(parseMentions("no mentions #card: here")).toEqual([]);
	});

	it("repeated calls give the same answer", () => {
		parseMentions("#card:abc");

		expect(parseMentions("#card:abc")).toEqual(["abc"]);
		expect(splitBody("#card:abc")).toEqual([
			{ kind: "mention", cardId: "abc" },
		]);
	});

	it("a body splits into text and mentions in order", () => {
		const parts = splitBody("fix #card:abc now");

		expect(parts).toEqual([
			{ kind: "text", text: "fix " },
			{ kind: "mention", cardId: "abc" },
			{ kind: "text", text: " now" },
		]);
	});

	it("a body that is only a mention has no text parts", () => {
		expect(splitBody("#card:abc")).toEqual([
			{ kind: "mention", cardId: "abc" },
		]);
	});

	it("a body without mentions is one text part", () => {
		expect(splitBody("plain words")).toEqual([
			{ kind: "text", text: "plain words" },
		]);
	});

	it("an empty body has no parts", () => {
		expect(splitBody("")).toEqual([]);
	});
});
