import { describe, expect, it } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	applicant,
	endHackathon,
	participants,
	startHackathon,
} from "../applications/applications.setup";
import { DEFAULT_SLOTS, shiftWeek, weekOf } from "../cycles/rules";
import { publishedHackathon } from "../hackathons/hackathons.setup";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.setup";
import { advancePast, createTest, DAY, HOUR } from "../testing/test.setup";

async function kindsTo(setup: Setup, to: string) {
	return await setup.t.run(async (ctx) =>
		(
			await ctx.db
				.query("emails")
				.withIndex("by_to", (q) => q.eq("to", to))
				.collect()
		).map((email) => email.kind),
	);
}

async function hackathonOf(setup: Setup, hackathonId: Id<"hackathons">) {
	const hackathon = await setup.t.run(
		async (ctx) => await ctx.db.get(hackathonId),
	);
	if (!hackathon) throw new Error("No Hackathon");
	return hackathon;
}

describe("timed emails", () => {
	it("the day before the start, each Builder hears it starts tomorrow", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await participants(setup, hackathonId, ["Ana"]);
		const { startsAt } = await hackathonOf(setup, hackathonId);

		await advancePast(setup.t, startsAt - Date.now() - DAY + HOUR);

		expect(await kindsTo(setup, "ana@example.com")).toContain(
			"starting_tomorrow",
		);
	});

	it("the day before the deadline, a Founder with undecided Builders is reminded, and one who decided everyone isn't", async () => {
		const reminded = await setUpStartup(createTest());
		const first = await publishedHackathon(reminded);
		await participants(reminded, first, ["Ana"]);
		await startHackathon(reminded, first);
		await endHackathon(reminded, first);
		const { decideBy } = await hackathonOf(reminded, first);
		await advancePast(reminded.t, decideBy - Date.now() - DAY + HOUR);
		expect(await kindsTo(reminded, "fay@example.com")).toContain(
			"decision_deadline",
		);

		const done = await setUpStartup(createTest());
		const second = await publishedHackathon(done);
		const [bo] = await participants(done, second, ["Bo"]);
		await startHackathon(done, second);
		await endHackathon(done, second);
		await done.founder.as.mutation(api.applications.decide, {
			applicationId: bo.applicationId,
			decision: "not_this_time",
			feedback: "Thanks",
		});
		const later = await hackathonOf(done, second);
		await advancePast(done.t, later.decideBy - Date.now() - DAY + HOUR);
		expect(await kindsTo(done, "fay@example.com")).not.toContain(
			"decision_deadline",
		);
	});

	it("the digest counts new applicants once", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await applicant(setup, hackathonId, "Ana");
		await applicant(setup, hackathonId, "Bo");

		await setup.t.mutation(internal.email.newApplicantsDigest, {});
		await setup.t.mutation(internal.email.newApplicantsDigest, {});

		const emails = await setup.t.run(
			async (ctx) => await ctx.db.query("emails").collect(),
		);
		const digests = emails.filter((email) => email.kind === "new_applicants");
		expect(digests).toHaveLength(1);
		expect(digests[0].subject).toBe("2 new Applicants for Frontend");
	});

	async function lockedMonday(started: boolean) {
		const setup = await setUpStartup(createTest());
		await addContributor(setup, "Sam");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(setup.startupId, {
				meetings: {
					...DEFAULT_SLOTS,
					firstWeek: shiftWeek(weekOf(Date.now()), 1),
					invited: [],
				},
			});
		});
		// Monday 12:00 IST, after the default opening meeting.
		await advancePast(
			setup.t,
			Date.parse("2026-06-08T12:00:00+05:30") - Date.now(),
		);
		if (started) {
			await setup.t.run(async (ctx) => {
				await ctx.db.insert("cycleWeeks", {
					startupId: setup.startupId,
					week: weekOf(Date.now()),
					startedAt: Date.now(),
					offUserIds: [],
				});
			});
		}
		await setup.t.mutation(internal.email.mondayReminders, {});
		return await kindsTo(setup, "fay@example.com");
	}

	it("the Monday reminder goes to a Founder whose week hasn't started", async () => {
		expect(await lockedMonday(false)).toEqual(["monday_reminder"]);
	});

	it("no Monday reminder after Start the week", async () => {
		expect(await lockedMonday(true)).toEqual([]);
	});
});
