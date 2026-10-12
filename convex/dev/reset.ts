import { internalMutation } from "../_generated/server";

const RESET_BATCH = 100;

/**
 * Dev reset for what a table import can't empty: stored files and pending
 * scheduled jobs, one batch per call. `pnpm data:clear` runs it until `done`.
 */
export const clearFilesAndJobs = internalMutation({
	args: {},
	handler: async (ctx) => {
		const files = await ctx.db.system.query("_storage").take(RESET_BATCH);
		for (const file of files) {
			await ctx.storage.delete(file._id);
		}
		const jobs = await ctx.db.system
			.query("_scheduled_functions")
			.filter((q) => q.eq(q.field("state.kind"), "pending"))
			.take(RESET_BATCH);
		for (const job of jobs) {
			await ctx.scheduler.cancel(job._id);
		}

		return {
			files: files.length,
			jobs: jobs.length,
			done: files.length < RESET_BATCH && jobs.length < RESET_BATCH,
		};
	},
});
