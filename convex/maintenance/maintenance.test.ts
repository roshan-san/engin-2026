import { describe, expect, it } from "vitest";
import { api, internal } from "../_generated/api";
import { createTest } from "../testing/test.setup";
import { signUp } from "../users/users.setup";

describe("maintenance", () => {
	it("the site is open until maintenance is turned on", async () => {
		const t = createTest();

		expect(await t.query(api.maintenance.status, {})).toBe(false);
	});

	it("turning maintenance on shows it to everyone, signed in or not", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");

		await t.mutation(internal.maintenance.set, { on: true });

		expect(await t.query(api.maintenance.status, {})).toBe(true);
		expect(await fay.as.query(api.maintenance.status, {})).toBe(true);
	});

	it("turning maintenance off opens the site again", async () => {
		const t = createTest();
		await t.mutation(internal.maintenance.set, { on: true });

		await t.mutation(internal.maintenance.set, { on: false });

		expect(await t.query(api.maintenance.status, {})).toBe(false);
	});
});
