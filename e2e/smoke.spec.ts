import { expect, test } from "./support/fixtures";
import { signUp } from "./support/people";

test("the landing page offers Google sign-in", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
});

test("a signed-in person lands on their startups", async ({ pageAs }) => {
	const page = await pageAs(await signUp("Fay"));

	await page.goto("/home");

	await expect(
		page.getByRole("heading", { name: "Your startups" }),
	).toBeVisible();
});
