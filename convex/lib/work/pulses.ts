import type { Infer } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { proofLink, pulseStatus } from "../../schema";
import { requireUserId } from "../auth";
import { requireTrialAccess } from "../hiring/trialCycles";
import { notify } from "../notify";
import { loadPublicUser } from "../people/users";
import { requireFounderMembership } from "../teams/membership";
import { requireCycleAccess } from "./cycles";

type PulseCtx = QueryCtx | MutationCtx;
type ProofLink = Infer<typeof proofLink>;

type PulseStatus = Infer<typeof pulseStatus>;

const LEGACY_STATUS: Record<string, PulseStatus> = {
	backlog: "todo",
	active: "in_progress",
	blocked: "in_progress",
};

/** Reads legacy states as their kanban equivalent until the migration has run. */
export function currentStatus(pulse: Doc<"pulses">): PulseStatus {
	return LEGACY_STATUS[pulse.status] ?? (pulse.status as PulseStatus);
}

export function proofLinksOf(pulse: Doc<"pulses">): ProofLink[] {
	if (pulse.proofLinks) {
		return pulse.proofLinks;
	}
	return pulse.evidenceUrl ? [{ kind: "other", url: pulse.evidenceUrl }] : [];
}

export function toPulse(pulse: Doc<"pulses">) {
	return {
		_id: pulse._id,
		title: pulse.title,
		description: pulse.description ?? null,
		status: currentStatus(pulse),
		priority: pulse.priority ?? null,
		dueAt: pulse.dueAt ?? null,
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
export type PulseContext =
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

async function requirePulseAccess(
	ctx: PulseCtx,
	pulseContext: PulseContext,
	userId: Id<"users">,
): Promise<void> {
	if (pulseContext.kind === "trial") {
		await requireTrialAccess(ctx, pulseContext.trial, userId);
		return;
	}
	await requireCycleAccess(ctx, pulseContext.cycleId, userId);
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
function requireActiveTrial(pulseContext: PulseContext): void {
	if (pulseContext.kind === "trial" && pulseContext.trial.status !== "active") {
		throw new Error("This Trial Cycle is not active");
	}
}

/**
 * Loads a Pulse the current user may work on, plus which kanban it lives on.
 * Submitted and Verified Pulses are locked: only a Founder's review moves them.
 */
export async function requireWorkablePulse(
	ctx: MutationCtx,
	pulseId: Id<"pulses">,
): Promise<{ pulse: Doc<"pulses">; context: PulseContext }> {
	const userId = await requireUserId(ctx);
	const pulse = await requirePulse(ctx, pulseId);
	const context = await loadPulseContext(ctx, pulse);
	await requirePulseAccess(ctx, context, userId);
	requireActiveTrial(context);

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
	requireActiveTrial(await loadPulseContext(ctx, pulse));
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
		href: pulseHref(pulse),
	});
}

export function pulseHref(pulse: Doc<"pulses">): string {
	return pulse.trialCycleId ? `/app/trials/${pulse.trialCycleId}` : "/app";
}
