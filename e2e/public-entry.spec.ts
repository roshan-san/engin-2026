import { expect, test } from "./support/fixtures";
import { signUp } from "./support/people";
import { founderWithStartup, publishedHackathon } from "./support/world";

test("a contributor finds a hackathon on Discover, applies, and tracks it in My Hackathons", async ({
	pageAs,
}) => {
	const { hackathonId, title } = await publishedHackathon(
		await founderWithStartup(),
	);
	const cara = await signUp("Cara");
	const page = await pageAs(cara);

	await page.goto("/discover");
	await page.getByRole("link", { name: title }).click();
	await expect(page).toHaveURL(new RegExp(`/hackathons/${hackathonId}`));
	await expect(page.getByText("Accepting applications")).toBeVisible();
	await expect(page.getByText("Design the flow")).toBeVisible();
	await page.getByRole("button", { name: "Apply" }).click();
	const dialog = page.getByRole("dialog");
	await dialog
		.getByLabel("Note to the founders (optional)")
		.fill("Keen to build this");
	await dialog.getByRole("checkbox").check();
	await dialog.getByRole("button", { name: "Apply" }).click();
	await expect(page.getByText("Applied", { exact: true })).toBeVisible();
	await page
		.getByRole("main")
		.getByRole("link", { name: "My Hackathons" })
		.click();

	const entry = page.getByRole("listitem").filter({ hasText: title });
	await expect(entry.getByText("Applied")).toBeVisible();
	await expect(entry.getByRole("button", { name: "Withdraw" })).toBeVisible();
});

test("anyone can compare plans on the pricing page", async ({ page }) => {
	await page.goto("/pricing");

	await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
	await expect(page.getByText("₹9,999")).toBeVisible();
	await page.getByRole("button", { name: "Monthly" }).click();
	await expect(page.getByText("/month")).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Sign in to go Pro" }),
	).toBeVisible();
});

test("the landing page invites people to join", async ({ page }) => {
	await page.goto("/");

	await expect(
		page.getByRole("heading", { name: "Hire by watching people build." }),
	).toBeVisible();
	await expect(page.getByRole("button", { name: "Join Engin" })).toBeVisible();
});
