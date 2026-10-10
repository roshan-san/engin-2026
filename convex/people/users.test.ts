import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { createTest } from "../lib/testing.helpers";
import { signUp, signUpNew } from "./users.helpers";

describe("users", () => {
	it("a new account starts at 1000, provisional", async () => {
		const t = createTest();
		const fay = await signUpNew(t, "Fay");

		const me = await fay.as.query(api.people.users.getMe, {});

		expect(me).toMatchObject({
			rating: 1000,
			ratingChange: 0,
			isProvisional: true,
			isInvestorPro: false,
		});
	});

	it("a public profile never shows the email", async () => {
		const t = createTest();
		await signUp(t, "Fay");

		const profile = await t.query(api.people.users.getByUsername, {
			username: "fay",
		});

		expect(profile).not.toBeNull();
		expect(profile).not.toHaveProperty("email");
	});

	it("a taken username is refused", async () => {
		const t = createTest();
		const sam = await signUp(t, "Sam");
		await signUp(t, "Fay");

		await expect(
			sam.as.mutation(api.people.users.updateProfile, { username: "fay" }),
		).rejects.toThrow("That username is taken");
	});

	it("Investor Pro is set only in the database", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");
		await t.run(
			async (ctx) =>
				await ctx.db.patch(fay.userId, { investorVerifiedAt: Date.now() }),
		);

		const me = await fay.as.query(api.people.users.getMe, {});

		expect(me?.isInvestorPro).toBe(true);
		await expect(
			fay.as.mutation(api.people.users.updateProfile, {
				// @ts-expect-error updateProfile takes no investorVerifiedAt
				investorVerifiedAt: Date.now(),
			}),
		).rejects.toThrow();
	});

	it("a profile is saved with its links and discipline", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");

		await fay.as.mutation(api.people.users.updateProfile, {
			bio: "  Builds things  ",
			discipline: "designer",
			githubUrl: "https://github.com/fay",
		});

		const profile = await t.query(api.people.users.getByUsername, {
			username: "fay",
		});
		expect(profile).toMatchObject({
			bio: "Builds things",
			discipline: "designer",
			links: { githubUrl: "https://github.com/fay" },
		});
	});

	it("a link that is not a web address is refused", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");

		await expect(
			fay.as.mutation(api.people.users.updateProfile, {
				portfolioUrl: "not a link",
			}),
		).rejects.toThrow("Portfolio must start with http:// or https://");
	});

	it("a reserved username is refused", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");

		await expect(
			fay.as.mutation(api.people.users.updateProfile, { username: "admin" }),
		).rejects.toThrow("This username is not available");
	});

	it("someone signed out sees no account", async () => {
		const t = createTest();

		expect(await t.query(api.people.users.getMe, {})).toBeNull();
	});
});
