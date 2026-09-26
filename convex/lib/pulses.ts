import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireUserId } from "./auth";
import { requireMembership } from "./membership";
import { notify } from "./notify";
import { refreshUserScore } from "./score";
import { requireTrialAccess } from "./trials";
import { loadPublicUser } from "./users";

type PulseCtx = QueryCtx | MutationCtx;

export function toPulse(pulse: Doc<"pulses">) {
	return {
		_id: pulse._id,
		title: pulse.title,
		description: pulse.description ?? null,
		status: pulse.status,
		priority: pulse.priority ?? null,
		dueAt: pulse.dueAt ?? null,
		evidenceUrl: pulse.evidenceUrl ?? null,
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

export async function requirePulseAccess(
	ctx: PulseCtx,
	pulse: Doc<"pulses">,
	userId: Id<"users">,
) {
	if (!pulse.trialCycleId) {
		await requireMembership(ctx, pulse.startupId, userId);
		return;
	}

	const trial = await ctx.db.get(pulse.trialCycleId);
	if (!trial) {
		throw new Error("Trial Cycle not found");
	}
	await requireTrialAccess(ctx, trial, userId);
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

/** Trial Pulses can only be worked on while their Trial Cycle is active. */
async function requireActiveTrial(ctx: PulseCtx, pulse: Doc<"pulses">) {
	if (!pulse.trialCycleId) {
		return;
	}
	const trial = await ctx.db.get(pulse.trialCycleId);
	if (trial?.status !== "active") {
		throw new Error("This Trial Cycle is not active");
	}
}

/**
 * Loads a Pulse the current user may work on. Submitted and Verified trial
 * Pulses are locked: only a Member's review moves them.
 */
export async function requireWorkablePulse(
	ctx: MutationCtx,
	pulseId: Id<"pulses">,
): Promise<Doc<"pulses">> {
	const userId = await requireUserId(ctx);
	const pulse = await requirePulse(ctx, pulseId);
	await requirePulseAccess(ctx, pulse, userId);
	await requireActiveTrial(ctx, pulse);

	if (pulse.trialCycleId && pulse.status === "review") {
		throw new Error("This Pulse is awaiting review");
	}
	if (pulse.trialCycleId && pulse.status === "done") {
		throw new Error("This Pulse is already verified");
	}
	return pulse;
}

/** Loads a Submitted Pulse the current user, as a Member, may review. */
export async function requireSubmittedPulse(
	ctx: MutationCtx,
	pulseId: Id<"pulses">,
): Promise<Doc<"pulses">> {
	const userId = await requireUserId(ctx);
	const pulse = await requirePulse(ctx, pulseId);
	await requireMembership(ctx, pulse.startupId, userId);
	await requireActiveTrial(ctx, pulse);
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
		| { status: "active"; reviewNote: string },
): Promise<void> {
	await ctx.db.patch(pulse._id, outcome);
	if (!pulse.assigneeUserId) {
		return;
	}

	await refreshUserScore(ctx, pulse.assigneeUserId);
	await notify(ctx, {
		userId: pulse.assigneeUserId,
		kind: "pulse",
		title:
			outcome.status === "done"
				? `${pulse.title} was verified`
				: `${pulse.title} needs changes`,
		body: outcome.reviewNote,
		href: pulse.trialCycleId ? `/app/trials/${pulse.trialCycleId}` : undefined,
	});
}
