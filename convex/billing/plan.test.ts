import { expect, test } from "vitest";
import { api, internal } from "../_generated/api";
import { createTest } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import {
	joinAsCoFounder,
	joinAsMember,
	setUpStartup,
} from "../teams/startups.helpers";

test("a contributor can't buy Pro", async () => {
	const t = createTest();
	const contributor = await signUp(t, "Contributor");

	const checkout = t.query(internal.billing.plan.prepareProCheckout, {
		userId: contributor.userId,
	});

	await expect(checkout).rejects.toThrow(
		"Pro is for startup founders. Contributors are always free.",
	);
});

test("a member who founds no startup can't buy Pro", async () => {
	const setup = await setUpStartup(createTest());
	const member = await joinAsMember(setup, "Member");

	const checkout = setup.t.query(internal.billing.plan.prepareProCheckout, {
		userId: member.userId,
	});

	await expect(checkout).rejects.toThrow(
		"Pro is for startup founders. Contributors are always free.",
	);
});

test("a founder already on Pro can't buy it again", async () => {
	const setup = await setUpStartup(createTest());
	await setup.t.run(
		async (ctx) =>
			await ctx.db.patch(setup.founder.userId, { planTier: "pro" }),
	);

	const checkout = setup.t.query(internal.billing.plan.prepareProCheckout, {
		userId: setup.founder.userId,
	});

	await expect(checkout).rejects.toThrow("You're already on Pro");
});

test("a Free founder and a Free co-founder can buy Pro", async () => {
	const setup = await setUpStartup(createTest());
	const coFounder = await joinAsCoFounder(setup, "Cofounder");

	const founderBuyer = await setup.t.query(
		internal.billing.plan.prepareProCheckout,
		{ userId: setup.founder.userId },
	);
	const coFounderBuyer = await setup.t.query(
		internal.billing.plan.prepareProCheckout,
		{ userId: coFounder.userId },
	);

	expect(founderBuyer).toEqual({
		email: "founder@example.com",
		name: "Founder",
	});
	expect(coFounderBuyer.email).toBe("cofounder@example.com");
});

test("the plan says only a Free founder can upgrade", async () => {
	const setup = await setUpStartup(createTest());
	const member = await joinAsMember(setup, "Member");
	const proFounder = await joinAsCoFounder(setup, "Pro");
	await setup.t.run(
		async (ctx) => await ctx.db.patch(proFounder.userId, { planTier: "pro" }),
	);

	const founderPlan = await setup.founder.as.query(
		api.billing.plan.getPlan,
		{},
	);
	const memberPlan = await member.as.query(api.billing.plan.getPlan, {});
	const proPlan = await proFounder.as.query(api.billing.plan.getPlan, {});

	expect(founderPlan).toMatchObject({ isPro: false, canUpgrade: true });
	expect(memberPlan).toMatchObject({ isPro: false, canUpgrade: false });
	expect(proPlan).toMatchObject({ isPro: true, canUpgrade: false });
});
