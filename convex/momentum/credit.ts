import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { weekOf } from "../cycles/rules";
import {
	approvalCredit,
	INSTANT_MS,
	MAX_APPROVALS_READ,
	type Trust,
} from "./rules";

export type Credit = {
	week: string;
	startupId: Id<"startups">;
	hackathonId?: Id<"hackathons">;
	approverId: Id<"users">;
	self: boolean;
	approverTrust: Trust;
	credit: number;
};

/** Freezes what an approval of `card` can be worth. A Card with no owner records nothing. */
export async function recordApproval(
	ctx: MutationCtx,
	card: Doc<"cards">,
	verifierId: Id<"users">,
	now: number,
): Promise<void> {
	if (!card.ownerId) {
		return;
	}
	const approver = await ctx.db.get(verifierId);
	await ctx.db.insert("approvals", {
		ownerId: card.ownerId,
		approverId: verifierId,
		startupId: card.startupId,
		hackathonId: card.hackathonId,
		cardId: card._id,
		week: weekOf(now),
		self: verifierId === card.ownerId,
		instant: now - card._creationTime < INSTANT_MS,
		approverTrust: approver?.trust ?? "low",
	});
}

/** Marks `now`'s week active for the person, once. */
export async function markActive(
	ctx: MutationCtx,
	userId: Id<"users">,
	now: number,
): Promise<void> {
	const week = weekOf(now);
	const existing = await ctx.db
		.query("activeWeeks")
		.withIndex("by_user_and_week", (q) =>
			q.eq("userId", userId).eq("week", week),
		)
		.first();
	if (!existing) {
		await ctx.db.insert("activeWeeks", { userId, week });
	}
}

/**
 * The approvals of a person's work with what each earns, newest first, from `fromWeek`
 * on and at `startupId` when given. An approval from someone the person has also
 * approved, at any startup, earns nothing.
 */
export async function loadCredits(
	ctx: QueryCtx,
	ownerId: Id<"users">,
	options: { fromWeek?: string; startupId?: Id<"startups"> },
): Promise<Credit[]> {
	const { fromWeek, startupId } = options;
	const rows = startupId
		? await ctx.db
				.query("approvals")
				.withIndex("by_startup_and_owner_and_week", (q) => {
					const owned = q.eq("startupId", startupId).eq("ownerId", ownerId);
					return fromWeek ? owned.gte("week", fromWeek) : owned;
				})
				.order("desc")
				.take(MAX_APPROVALS_READ)
		: await ctx.db
				.query("approvals")
				.withIndex("by_owner_and_week", (q) => {
					const owned = q.eq("ownerId", ownerId);
					return fromWeek ? owned.gte("week", fromWeek) : owned;
				})
				.order("desc")
				.take(MAX_APPROVALS_READ);

	// One lookup per approver: have they had work approved by this person?
	const mutual = new Map<Id<"users">, Promise<boolean>>();
	const isMutual = (approverId: Id<"users">): Promise<boolean> => {
		let known = mutual.get(approverId);
		if (!known) {
			known = ctx.db
				.query("approvals")
				.withIndex("by_approver_and_owner", (q) =>
					q.eq("approverId", ownerId).eq("ownerId", approverId),
				)
				.first()
				.then((row) => row !== null);
			mutual.set(approverId, known);
		}
		return known;
	};

	return await Promise.all(
		rows.map(async (row) => ({
			week: row.week,
			startupId: row.startupId,
			hackathonId: row.hackathonId,
			approverId: row.approverId,
			self: row.self,
			approverTrust: row.approverTrust,
			credit: approvalCredit(
				row,
				!row.self && (await isMutual(row.approverId)),
			),
		})),
	);
}
