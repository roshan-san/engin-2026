import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { pulseHref } from "../lib/links";
import { notify } from "../people/notifications.rules";
import { loadPublicUser } from "../people/users.rules";
import type { proofLink } from "../schema";
import { requireFounderMembership } from "../teams/membership.rules";
import { requireBoardOwner } from "./boards.rules";
import { requireCycleAccess } from "./cycles.rules";

type PulseCtx = QueryCtx | MutationCtx;
type ProofLink = Infer<typeof proofLink>;

export function proofLinksOf(pulse: Doc<"pulses">): ProofLink[] {
	return pulse.proofLinks ?? [];
}

export function toPulse(pulse: Doc<"pulses">) {
	return {
		_id: pulse._id,
		title: pulse.title,
		description: pulse.description ?? null,
		status: pulse.status,
		proofLinks: proofLinksOf(pulse),
		reviewNote: pulse.reviewNote ?? null,
		cycleId: pulse.cycleId ?? null,
		trialCycleId: pulse.trialCycleId ?? null,
	};
}

export async function withAssignees(ctx: QueryCtx, pulses: Doc<"pulses">[]) {
	const results = [];
	for (const pulse of pulses) {
		results.push({
			...toPulse(pulse),
			assignee: await loadPublicUser(ctx, pulse.assigneeUserId),
		});
	}
	return results;
}

/** Which kanban a Pulse lives on: a Trial Cycle's Board or a Startup's Cycle. */
type PulseContext =
	| { kind: "trial"; trial: Doc<"trialCycles"> }
	| { kind: "cycle"; cycleId: Id<"cycles"> };

/** Classifies a Pulse and loads what its kind needs, in one fetch. */
export async function loadPulseContext(
	ctx: PulseCtx,
	pulse: Doc<"pulses">,
): Promise<PulseContext> {
	if (pulse.trialCycleId) {
		const trial = await ctx.db.get(pulse.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}
		return { kind: "trial", trial };
	}
	if (pulse.cycleId) {
		return { kind: "cycle", cycleId: pulse.cycleId };
	}
	throw new Error("Pulse has no Cycle or Trial Cycle");
}

export async function requirePulse(
	ctx: PulseCtx,
	pulseId: Id<"pulses">,
): Promise<Doc<"pulses">> {
	const pulse = await ctx.db.get(pulseId);
	if (!pulse) {
		throw new Error("Pulse not found");
	}
	return pulse;
}

/**
 * Loads a Pulse the current user may work on, plus which kanban it lives on.
 * A Board Pulse is worked freely by its owner; on a Cycle, Submitted and
 * Verified Pulses are locked: only a Founder's review moves them.
 */
export async function requireWorkablePulse(
	ctx: MutationCtx,
	pulseId: Id<"pulses">,
): Promise<{ pulse: Doc<"pulses">; context: PulseContext }> {
	const userId = await requireUserId(ctx);
	const pulse = await requirePulse(ctx, pulseId);
	const context = await loadPulseContext(ctx, pulse);

	if (context.kind === "trial") {
		await requireBoardOwner(ctx, context.trial, pulse, userId);
		return { pulse, context };
	}

	await requireCycleAccess(ctx, context.cycleId, userId);
	if (pulse.status === "review") {
		throw new Error("This Pulse is awaiting review");
	}
	if (pulse.status === "done") {
		throw new Error("This Pulse is already verified");
	}
	return { pulse, context };
}

/** Loads a Submitted Pulse the current user, as a Founder, may review. */
export async function requireSubmittedPulse(
	ctx: MutationCtx,
	pulseId: Id<"pulses">,
): Promise<Doc<"pulses">> {
	const userId = await requireUserId(ctx);
	const pulse = await requirePulse(ctx, pulseId);
	await requireFounderMembership(ctx, pulse.startupId, userId);
	if (pulse.trialCycleId) {
		throw new Error("Pulses on a Board are not reviewed");
	}
	if (pulse.status !== "review") {
		throw new Error("This Pulse is not awaiting review");
	}
	return pulse;
}

export async function resolveReview(
	ctx: MutationCtx,
	pulse: Doc<"pulses">,
	outcome:
		| { status: "done"; reviewNote: undefined }
		| { status: "in_progress"; reviewNote: string },
): Promise<void> {
	await ctx.db.patch(pulse._id, outcome);
	if (!pulse.assigneeUserId) {
		return;
	}

	await notify(ctx, {
		userId: pulse.assigneeUserId,
		kind: "pulse",
		title:
			outcome.status === "done"
				? `${pulse.title} was verified`
				: `${pulse.title} needs changes`,
		body: outcome.reviewNote,
		href: await pulseHref(ctx, pulse),
	});
}
