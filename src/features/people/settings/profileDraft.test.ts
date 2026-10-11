import { describe, expect, test } from "vitest";
import {
	type ProfileSource,
	toProfileArgs,
	toProfileDraft,
} from "./profileDraft";

const me: ProfileSource = {
	username: "fay",
	discipline: "designer",
	bio: "Builds things",
	links: {
		linkedinUrl: "https://linkedin.com/in/fay",
		githubUrl: null,
		portfolioUrl: "https://fay.test",
	},
};

describe("profile settings draft", () => {
	test("an untouched draft sends nothing", () => {
		const draft = toProfileDraft(me);

		expect(toProfileArgs(draft, me)).toEqual({});
	});

	test("only changed fields are sent", () => {
		const draft = {
			...toProfileDraft(me),
			bio: "Designs things",
			discipline: "engineer" as const,
		};

		expect(toProfileArgs(draft, me)).toEqual({
			bio: "Designs things",
			discipline: "engineer",
		});
	});

	test("a username is sent lowercased and trimmed", () => {
		const draft = { ...toProfileDraft(me), username: "  Fay_Designs " };

		expect(toProfileArgs(draft, me)).toEqual({ username: "fay_designs" });
	});

	test("a username that only changes case sends nothing", () => {
		const draft = { ...toProfileDraft(me), username: " FAY " };

		expect(toProfileArgs(draft, me)).toEqual({});
	});

	test("clearing a link sends an empty string", () => {
		const draft = { ...toProfileDraft(me), linkedinUrl: "  " };

		expect(toProfileArgs(draft, me)).toEqual({ linkedinUrl: "" });
	});

	test("a person with no links, bio or discipline starts with blank fields", () => {
		const bare: ProfileSource = {
			username: null,
			discipline: null,
			bio: null,
			links: { linkedinUrl: null, githubUrl: null, portfolioUrl: null },
		};

		const draft = toProfileDraft(bare);

		expect(draft).toEqual({
			username: "",
			discipline: null,
			bio: "",
			linkedinUrl: "",
			githubUrl: "",
			portfolioUrl: "",
		});
		expect(toProfileArgs(draft, bare)).toEqual({});
	});
});
