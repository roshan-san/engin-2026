import { expect, test } from "vitest";
import { internal } from "./_generated/api";
import { createTest, setUpStartup } from "./test.helpers";

test("migrating Pulses maps legacy states, moves evidence to Proof Links and drops Cycle-less internal Pulses", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const ids = await t.run(async (ctx) => {
		const cycleId = await ctx.db.insert("cycles", {
			startupId: setup.startupId,
			title: "Old cycle",
			startAt: 0,
			endAt: 1,
			status: "active",
		});
		const base = {
			startupId: setup.startupId,
			createdByUserId: setup.founder.userId,
			cycleId,
		};
		return {
			backlog: await ctx.db.insert("pulses", {
				...base,
				title: "a",
				status: "backlog",
			}),
			active: await ctx.db.insert("pulses", {
				...base,
				title: "b",
				status: "active",
				evidenceUrl: "https://example.com/pr",
			}),
			blocked: await ctx.db.insert("pulses", {
				...base,
				title: "c",
				status: "blocked",
			}),
			orphan: await ctx.db.insert("pulses", {
				startupId: setup.startupId,
				createdByUserId: setup.founder.userId,
				title: "d",
				status: "done",
			}),
		};
	});

	await t.mutation(internal.migrations.migratePulses, {});

	const after = await t.run(async (ctx) => ({
		backlog: await ctx.db.get(ids.backlog),
		active: await ctx.db.get(ids.active),
		blocked: await ctx.db.get(ids.blocked),
		orphan: await ctx.db.get(ids.orphan),
	}));
	expect(after.backlog?.status).toBe("todo");
	expect(after.active?.status).toBe("in_progress");
	expect(after.active?.proofLinks).toEqual([
		{ kind: "other", url: "https://example.com/pr" },
	]);
	expect(after.active?.evidenceUrl).toBeUndefined();
	expect(after.blocked?.status).toBe("in_progress");
	expect(after.orphan).toBeNull();
});
