import { expect, it } from "vitest";
import { internal } from "../_generated/api";
import { createTest, DAY } from "../testing/test.setup";

it("a dev reset deletes stored files and cancels pending jobs", async () => {
	const t = createTest();
	const fileId = await t.run((ctx) => ctx.storage.store(new Blob(["logo"])));
	const jobId = await t.run((ctx) =>
		ctx.scheduler.runAfter(DAY, internal.dev.reset.clearFilesAndJobs, {}),
	);

	const result = await t.mutation(internal.dev.reset.clearFilesAndJobs, {});

	expect(result).toEqual({ files: 1, jobs: 1, done: true });
	expect(await t.run((ctx) => ctx.storage.getUrl(fileId))).toBeNull();
	const job = await t.run((ctx) => ctx.db.system.get(jobId));
	expect(job?.state.kind).toBe("canceled");
});
