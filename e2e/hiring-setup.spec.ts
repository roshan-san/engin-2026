import { expect, test } from "./support/fixtures";
import { signUp } from "./support/people";
import { startupOf } from "./support/world";

test("a Founder creates a Role, then publishes a hackathon with the free credit", async ({
	pageAs,
}) => {
	const founder = await signUp("Fay");
	const { slug } = await startupOf(founder);
	const page = await pageAs(founder);

	await page.goto(`/s/${slug}/hiring`);
	await expect(page.getByText("1 hackathon credit")).toBeVisible();
	await page.getByRole("link", { name: "New hackathon" }).click();
	await page.getByRole("button", { name: "New Role" }).click();
	const newRole = page.getByRole("group", { name: "New Role" });
	await newRole.getByLabel("Title").fill("Designer");
	await newRole.getByLabel("Short description").fill("Designs the product");
	await newRole.getByRole("button", { name: "Create Role" }).click();
	await expect(page.getByRole("combobox", { name: "Role" })).toHaveText(
		"Designer",
	);
	await page.getByLabel("Title", { exact: true }).fill("Build onboarding");
	await page
		.getByLabel("Description", { exact: true })
		.fill("Ship the onboarding flow");
	await page.getByLabel("New Starting Pulse title").fill("Design the flow");
	await page.getByLabel("New Starting Pulse title").press("Enter");
	await page.getByRole("button", { name: "Continue to publish" }).click();
	await page.getByRole("checkbox").check();
	await page
		.getByRole("button", { name: "Publish, uses your free credit" })
		.click();

	await expect(page.getByText("0 hackathon credits")).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Build onboarding" }),
	).toBeVisible();
	await expect(page.getByText("0/5 participants")).toBeVisible();
});

test("a Founder saves a hackathon draft for later", async ({ pageAs }) => {
	const founder = await signUp("Fay");
	const { slug } = await startupOf(founder);
	const page = await pageAs(founder);

	await page.goto(`/s/${slug}/hiring/new`);
	await page.getByRole("combobox", { name: "Role" }).click();
	await page.getByRole("option", { name: "Engineer" }).click();
	await page.getByLabel("Title", { exact: true }).fill("Draft idea");
	await page.getByLabel("Description", { exact: true }).fill("Not ready yet");
	await page.getByLabel("New Starting Pulse title").fill("First task");
	await page.getByLabel("New Starting Pulse title").press("Enter");
	await page.getByRole("button", { name: "Save for later" }).click();

	await expect(page.getByRole("link", { name: "Draft idea" })).toBeVisible();
	await expect(page.getByText("1 hackathon credit")).toBeVisible();
});
