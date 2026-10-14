import type { Doc } from "@convex/_generated/dataModel";
import { describe, expect, test } from "vitest";
import { toSettingsDraft, toUpdateArgs } from "./settingsDraft";

const startup = {
	name: "Acme",
	oneLiner: "Invoices for plumbers",
	website: "https://acme.test",
	stage: "building",
	category: "saas",
	city: "pune",
} as Doc<"startups">;

describe("startup settings draft", () => {
	test("an untouched draft sends nothing", () => {
		const draft = toSettingsDraft(startup);

		expect(toUpdateArgs(draft, startup)).toEqual({});
	});

	test("only changed fields are sent", () => {
		const draft = {
			...toSettingsDraft(startup),
			stage: "launched" as const,
			city: "mumbai" as const,
		};

		expect(toUpdateArgs(draft, startup)).toEqual({
			stage: "launched",
			city: "mumbai",
		});
	});

	test("a trimmed name is sent trimmed", () => {
		const draft = { ...toSettingsDraft(startup), name: "  Acme Labs  " };

		expect(toUpdateArgs(draft, startup)).toEqual({ name: "Acme Labs" });
	});

	test("padding around an unchanged name sends nothing", () => {
		const draft = { ...toSettingsDraft(startup), name: " Acme " };

		expect(toUpdateArgs(draft, startup)).toEqual({});
	});

	test("a cleared website and one line are sent blank to remove them", () => {
		const draft = { ...toSettingsDraft(startup), website: " ", oneLiner: "" };

		expect(toUpdateArgs(draft, startup)).toEqual({ website: "", oneLiner: "" });
	});

	test("a Startup with no website or one line starts with blank fields", () => {
		const bare = {
			...startup,
			oneLiner: undefined,
			website: undefined,
		} as Doc<"startups">;

		const draft = toSettingsDraft(bare);

		expect(draft.website).toBe("");
		expect(draft.oneLiner).toBe("");
		expect(toUpdateArgs(draft, bare)).toEqual({});
	});
});
