import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { loadWeekContext } from "../cycles/model";
import { weekOf } from "../cycles/rules";
import { loadParticipants } from "../hackathons/model";
import { loadFounderIds } from "../startups/team";
import {
	decisionDeadlineEmail,
	mondayReminderEmail,
	newApplicantsEmail,
	startingTomorrowEmail,
} from "./copy";
import { emailUser, hackathonNames } from "./model";
import { siteUrl } from "./rules";

/** Open Hackathons read per digest run, and startups per Monday batch. */
const MAX_DIGEST_HACKATHONS = 500;
const MONDAY_BATCH = 100;

/** The day before the start: every Builder hears it starts tomorrow. */
export async function remindStart(
	ctx: MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<void> {
	const hackathon = await ctx.db.get(hackathonId);
	if (hackathon?.status !== "open") {
		return;
	}
	const names = await hackathonNames(ctx, hackathon);
	for (const participant of await loadParticipants(ctx, hackathon._id)) {
		await emailUser(ctx, participant.userId, {
			kind: "starting_tomorrow",
			dedupeKey: `start:${hackathon._id}:${participant.userId}`,
			...startingTomorrowEmail({
				...names,
				startsAt: hackathon.startsAt,
				url: `${siteUrl()}/h/${hackathon._id}`,
			}),
		});
	}
}

/** The day before the deadline: the Founder hears how many Builders are still waiting. */
export async function remindDecision(
	ctx: MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<void> {
	const hackathon = await ctx.db.get(hackathonId);
	if (hackathon?.status !== "live" && hackathon?.status !== "deciding") {
		return;
	}
	const undecided = (await loadParticipants(ctx, hackathon._id)).filter(
		(participant) => !participant.decision,
	).length;
	const startup = await ctx.db.get(hackathon.startupId);
	if (undecided === 0 || !startup) {
		return;
	}
	const email = decisionDeadlineEmail({
		...(await hackathonNames(ctx, hackathon)),
		undecided,
		decideBy: hackathon.decideBy,
		url: `${siteUrl()}/s/${startup.slug}/hiring/${hackathon._id}`,
	});
	for (const founderId of await loadFounderIds(ctx, startup)) {
		await emailUser(ctx, founderId, {
			kind: "decision_deadline",
			dedupeKey: `deadline:${hackathon._id}:${founderId}`,
			...email,
		});
	}
}

/** Each morning: Founders hear how many Applicants arrived since the last digest. */
export async function newApplicantsDigest(ctx: MutationCtx): Promise<void> {
	const open = await ctx.db
		.query("hackathons")
		.withIndex("by_status_and_startsAt", (q) => q.eq("status", "open"))
		.take(MAX_DIGEST_HACKATHONS);
	for (const hackathon of open) {
		const count = hackathon.applicantCount - (hackathon.applicantsEmailed ?? 0);
		const startup = await ctx.db.get(hackathon.startupId);
		if (count <= 0 || !startup) {
			continue;
		}
		await ctx.db.patch(hackathon._id, {
			applicantsEmailed: hackathon.applicantCount,
		});
		const email = newApplicantsEmail({
			...(await hackathonNames(ctx, hackathon)),
			count,
			url: `${siteUrl()}/s/${startup.slug}/hiring/${hackathon._id}`,
		});
		for (const founderId of await loadFounderIds(ctx, startup)) {
			await emailUser(ctx, founderId, { kind: "new_applicants", ...email });
		}
	}
}

/** Monday after the opening meeting: Founders whose Board is still locked are nudged to Start the week. Returns the next page's cursor. */
export async function mondayReminders(
	ctx: MutationCtx,
	cursor: string | null,
): Promise<string | null> {
	const now = Date.now();
	const page = await ctx.db
		.query("startups")
		.paginate({ cursor, numItems: MONDAY_BATCH });
	for (const startup of page.page) {
		if (!startup.meetings) {
			continue;
		}
		const { state } = await loadWeekContext(ctx, startup, now);
		if (state !== "planning") {
			continue;
		}
		const email = mondayReminderEmail({
			startupName: startup.name,
			url: `${siteUrl()}/s/${startup.slug}/cycle`,
		});
		for (const founderId of await loadFounderIds(ctx, startup)) {
			await emailUser(ctx, founderId, {
				kind: "monday_reminder",
				dedupeKey: `monday:${startup._id}:${weekOf(now)}:${founderId}`,
				...email,
			});
		}
	}
	return page.isDone ? null : page.continueCursor;
}
