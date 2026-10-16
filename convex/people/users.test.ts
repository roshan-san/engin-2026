import { describe, expect, it, vi } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { buildUniqueUsername } from "../model/username";
import { onUserSignedIn } from "../model/users";
import { createTest, type TestConvex } from "../testing/test.setup";
import { signUp, signUpNew } from "../testing/users.setup";

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

		const profile = await t.query(api.people.users.getRecord, {
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

		const profile = await fay.as.query(api.people.users.getMe);
		expect(profile).toMatchObject({
			bio: "Builds things",
			discipline: "designer",
			links: { githubUrl: "https://github.com/fay" },
		});
	});

	it("a person clears their discipline", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");
		await fay.as.mutation(api.people.users.updateProfile, {
			discipline: "designer",
		});

		await fay.as.mutation(api.people.users.updateProfile, {
			discipline: null,
		});

		const me = await fay.as.query(api.people.users.getMe, {});
		expect(me?.discipline).toBeNull();
	});

	it("a blank link and bio clear what was saved", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");
		await fay.as.mutation(api.people.users.updateProfile, {
			bio: "Builds things",
			githubUrl: "https://github.com/fay",
		});

		await fay.as.mutation(api.people.users.updateProfile, {
			bio: "",
			githubUrl: "",
		});

		const me = await fay.as.query(api.people.users.getMe, {});
		expect(me).toMatchObject({ bio: null, links: { githubUrl: null } });
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

	describe("username on sign-in", () => {
		async function signIn(
			t: TestConvex,
			name: string,
			existing: Id<"users"> | null = null,
		) {
			const userId = await t.run(
				async (ctx) => await ctx.db.insert("users", { name }),
			);
			await t.run(
				async (ctx) =>
					await onUserSignedIn(ctx, { userId, existingUserId: existing }),
			);
			return t.withIdentity({ subject: `${userId}|session` });
		}

		it("a new account gets a username from its name", async () => {
			const t = createTest();

			const priya = await signIn(t, "Priya Sharma");

			const me = await priya.query(api.people.users.getMe, {});
			expect(me?.username).toBe("priya_sharma");
		});

		it("a taken username gets a number", async () => {
			const t = createTest();
			await signIn(t, "Priya Sharma");

			const second = await signIn(t, "Priya Sharma");

			const me = await second.query(api.people.users.getMe, {});
			expect(me?.username).toBe("priya_sharma_2");
		});

		it("a name with no usable letters still gets a username", async () => {
			const t = createTest();

			const first = await signIn(t, "李雷");
			const second = await signIn(t, "007");

			expect((await first.query(api.people.users.getMe, {}))?.username).toBe(
				"participant",
			);
			expect((await second.query(api.people.users.getMe, {}))?.username).toBe(
				"participant_2",
			);
		});

		/** Accounts already holding `sam`, `sam_2` … `sam_9`, plus any extra handles. */
		async function takeSamNames(t: TestConvex, extra: string[] = []) {
			const taken = ["sam", ...[2, 3, 4, 5, 6, 7, 8, 9].map((n) => `sam_${n}`)];
			await t.run(async (ctx) => {
				for (const username of [...taken, ...extra]) {
					await ctx.db.insert("users", { name: "Sam", username });
				}
			});
		}

		it("after nine taken names it adds four random digits", async () => {
			const t = createTest();
			await takeSamNames(t);

			const sam = await signIn(t, "Sam");

			const me = await sam.query(api.people.users.getMe, {});
			expect(me?.username).toMatch(/^sam_\d{4}$/);
		});

		it("a reserved email local part falls back to participant", async () => {
			const t = createTest();
			const userId = await t.run(
				async (ctx) =>
					await ctx.db.insert("users", { email: "admin@example.com" }),
			);

			await t.run(
				async (ctx) =>
					await onUserSignedIn(ctx, { userId, existingUserId: null }),
			);

			const me = await t
				.withIdentity({ subject: `${userId}|session` })
				.query(api.people.users.getMe, {});
			expect(me?.username).toBe("participant");
		});

		it("it gives up after twenty random tries", { timeout: 2000 }, async () => {
			const t = createTest();
			await takeSamNames(t, ["sam_0000"]);
			vi.spyOn(Math, "random").mockReturnValue(0);

			await expect(
				t.run(async (ctx) => await buildUniqueUsername(ctx, "Sam")),
			).rejects.toThrow("Couldn't pick a username");

			vi.restoreAllMocks();
		});

		it("a returning sign-in keeps its username", async () => {
			const t = createTest();
			const fay = await signUp(t, "Fay");

			await t.run(
				async (ctx) =>
					await onUserSignedIn(ctx, {
						userId: fay.userId,
						existingUserId: fay.userId,
					}),
			);

			const me = await fay.as.query(api.people.users.getMe, {});
			expect(me?.username).toBe("fay");
		});
	});
});
