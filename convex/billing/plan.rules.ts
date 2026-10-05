import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { loadMembershipsOf } from "../teams/membership.rules";

/**
 * Why this user can't buy Pro, or `null` when they can. Pro is for founders:
 * contributors never pay, so there is no contributor Pro.
 */
export async function loadProUpgradeBlock(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<string | null> {
	const user = await ctx.db.get(userId);
	if (user?.planTier === "pro") {
		return "You're already on Pro";
	}

	const memberships = await loadMembershipsOf(ctx, userId);
	if (!memberships.some((entry) => entry.role === "founder")) {
		return "Pro is for startup founders. Contributors are always free.";
	}

	return null;
}

export async function requireProUpgradable(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<{ email: string; name: string }> {
	const block = await loadProUpgradeBlock(ctx, userId);
	if (block) {
		throw new Error(block);
	}

	const user = await ctx.db.get(userId);
	if (!user?.email) {
		throw new Error("Add an email to your account before upgrading");
	}

	return { email: user.email, name: user.name ?? user.email };
}
