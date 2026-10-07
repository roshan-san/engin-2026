import { api } from "../convex/_generated/api";
import { expect, test } from "./support/fixtures";
import { signUp } from "./support/people";

test("a Founder rushes through onboarding, invites a teammate, and files a Role under a Team", async ({
	pageAs,
}) => {
	const founder = await signUp("Fay");
	const page = await pageAs(founder);

	await page.goto("/startups/new");
	await page.getByRole("textbox", { name: "What's it called?" }).fill("Rushco");
	await page.getByRole("button", { name: "Skip all" }).click();
	await expect(
		page.getByRole("heading", { name: "Invite your team" }),
	).toBeVisible();
	await page
		.getByRole("textbox", { name: "Teammate 1" })
		.fill(`zed_${founder.username}@e2e.test`);
	await page.getByRole("button", { name: "Send invites" }).click();
	await expect(page).toHaveURL(/\/s\/[^/]+\/cycles$/);

	const [membership] = await founder.api.query(
		api.teams.startups.listMemberships,
		{},
	);
	const startupId = membership.startup._id;
	await founder.api.mutation(api.hiring.roles.create, {
		startupId,
		title: "Engineer",
		type: "full-time",
		skills: [],
		description: "Builds the product",
		headcount: 1,
	});

	await page.goto(`/s/${membership.startup.slug}/team`);
	await expect(
		page.getByText(`zed_${founder.username}@e2e.test`),
	).toBeVisible();
	await page.getByRole("button", { name: "New Team" }).click();
	await page.getByLabel("Name").fill("Payments");
	await page.getByRole("button", { name: "Create Team" }).click();
	const team = page
		.getByRole("listitem")
		.filter({ has: page.getByRole("button", { name: "Members" }) });
	await team.getByRole("button", { name: "Members" }).click();
	await page.getByRole("menuitemcheckbox", { name: "Fay" }).click();
	await page.keyboard.press("Escape");
	await expect(team).toContainText("1 person");

	await page.goto(`/s/${membership.startup.slug}/hiring`);
	await page.getByRole("button", { name: "New Role" }).click();
	await page.getByLabel("Title").fill("Designer");
	await page.getByRole("combobox", { name: "Team" }).click();
	await page.getByRole("option", { name: "Payments" }).click();
	await page.getByLabel("Short description").fill("Designs the product");
	await page.getByRole("button", { name: "Create Role" }).click();
	await page.getByRole("tab", { name: "Roles" }).click();
	await page.getByRole("combobox", { name: "Filter by Team" }).click();
	await page.getByRole("option", { name: "Payments" }).click();

	await expect(
		page.getByRole("listitem").filter({ hasText: "Designer" }),
	).toBeVisible();
	await expect(
		page.getByRole("combobox", { name: "Team for Engineer" }),
	).toBeHidden();
});
