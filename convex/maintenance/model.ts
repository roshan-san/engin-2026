import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function isUnderMaintenance(ctx: QueryCtx): Promise<boolean> {
	const row = await ctx.db.query("maintenance").first();
	return row?.on ?? false;
}

export async function setMaintenance(ctx: MutationCtx, on: boolean) {
	const row = await ctx.db.query("maintenance").first();
	if (row) {
		await ctx.db.patch(row._id, { on });
	} else {
		await ctx.db.insert("maintenance", { on });
	}
}
