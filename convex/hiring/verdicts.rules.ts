import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { hackathonHref } from "../lib/links";
import { optionalText } from "../lib/text";
import { notify } from "../people/notifications.rules";
import { refreshUserScore } from "../people/score.rules";
import type { hackathonVerdict } from "../schema";
import { getMembership } from "../teams/membership.rules";
import {
	listHackathonApplications,
	setHackathonStatus,
} from "./hackathons.rules";

type HackathonVerdict = Infer<typeof hackathonVerdict>;

type CloseInput = {
	verdicts: {
		applicationId: Id<"applications">;
		verdict: HackathonVerdict;
		evaluation?: string;
	}[];
};

/**
 * Closing is all-or-nothing: every Participant gets a Verdict, or nothing is
 * written. Every Task in Review is resolved first, so the lanes show only
 * verified work; unfinished Tasks stay, read-only.
 */
export async function closeWithVerdicts(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	input: CloseInput,
): Promise<void> {
	if (hackathon.status !== "active") {
		throw new Error("Only an active Hackathon can be closed");
	}
	const inReview = await ctx.db
		.query("tasks")
		.withIndex("by_cycle_and_status", (q) =>
			q.eq("cycleId", hackathon.cycleId).eq("status", "review"),
		)
		.first();
	if (inReview) {
		throw new Error("Verify or send back every Task in Review before closing");
	}

	const participants = (
		await listHackathonApplications(ctx, hackathon._id)
	).filter((application) => application.status === "accepted");
	const verdictsByApplication = new Map(
		input.verdicts.map((entry) => [entry.applicationId, entry]),
	);
	if (
		verdictsByApplication.size !== participants.length ||
		participants.some(
			(participant) => !verdictsByApplication.has(participant._id),
		)
	) {
		throw new Error("Every Participant needs a Verdict");
	}

	const makesOffers = input.verdicts.some(
		(entry) => entry.verdict === "passed_with_offer",
	);
	const role = await ctx.db.get(hackathon.roleId);
	if (makesOffers && role?.status !== "open") {
		throw new Error("This Role is filled, so it can't make Offers");
	}

	await setHackathonStatus(ctx, hackathon, "closed");

	const href = await hackathonHref(ctx, hackathon);
	for (const participant of participants) {
		const entry = verdictsByApplication.get(participant._id);
		if (!entry) {
			continue;
		}
		// Score integrity: someone who joined the team mid-hackathon keeps the
		// Verdict but earns no Score from it (eng review R3).
		const isOnTeam =
			(await getMembership(ctx, hackathon.startupId, participant.userId)) !==
			null;
		await ctx.db.patch(participant._id, {
			status: "completed",
			verdict: entry.verdict,
			evaluation: optionalText(entry.evaluation),
			...(isOnTeam ? { scoreExcluded: true } : {}),
		});
		if (entry.verdict === "passed_with_offer") {
			await ctx.db.insert("offers", {
				applicationId: participant._id,
				hackathonId: hackathon._id,
				roleId: hackathon.roleId,
				startupId: hackathon.startupId,
				userId: participant.userId,
				status: "pending",
			});
		}
		await refreshUserScore(ctx, participant.userId);
		await notify(ctx, {
			userId: participant.userId,
			kind: "hackathon",
			title: `Your Verdict for ${hackathon.title} is in`,
			href,
		});
	}
}
