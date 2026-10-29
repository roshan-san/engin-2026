import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { createTest } from "../testing/test.setup";
import { signUp } from "../testing/users.setup";

describe("files", () => {
	it("a signed-in person can get an upload URL; nobody else can", async () => {
		const t = createTest();
		const ada = await signUp(t, "Ada");

		const url = await ada.as.mutation(api.files.generateUploadUrl, {});

		expect(typeof url).toBe("string");
		await expect(t.mutation(api.files.generateUploadUrl, {})).rejects.toThrow(
			"Not authenticated",
		);
	});
});
