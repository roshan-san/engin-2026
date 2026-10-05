import { expect, test } from "./support/fixtures";
import { signUp } from "./support/people";
import { founderWithStartup, join } from "./support/world";

test("a Cycle runs: plan, start, take a Pulse, prove it, verify it, see it in My Pulses", async ({
	pageAs,
}) => {
	const startup = await founderWithStartup();
	const max = await signUp("Max");
	await join(startup, max);
	const founderPage = await pageAs(startup.founder);
	const maxPage = await pageAs(max);

	// The Founder plans a Cycle with Max on it, starts it and adds a Pulse.
	await founderPage.goto(`/s/${startup.slug}/cycles`);
	await founderPage.getByRole("button", { name: "New Cycle" }).click();
	const newCycle = founderPage.getByRole("dialog");
	await newCycle.getByLabel("Title").fill("Cycle 1");
	await newCycle.getByLabel("Starts").fill("2026-10-05");
	await newCycle.getByLabel("Ends").fill("2026-10-19");
	await newCycle.getByRole("button", { name: "Create Cycle" }).click();
	await expect(founderPage.getByText("Planned")).toBeVisible();
	await founderPage.getByRole("button", { name: "Manage" }).click();
	// Saved straight away, so the box ticks once the server answers.
	await founderPage.getByRole("checkbox", { name: "Max" }).click();
	await expect(
		founderPage.getByRole("checkbox", { name: "Max" }),
	).toBeChecked();
	await founderPage.getByRole("button", { name: "Close" }).click();
	await expect(founderPage.getByText("Max + Founders")).toBeVisible();
	await founderPage.getByRole("button", { name: "Start Cycle" }).click();
	await expect(founderPage.getByText("Active")).toBeVisible();
	await founderPage
		.getByRole("textbox", { name: "Pulse title" })
		.fill("Ship billing page");
	await founderPage
		.getByRole("textbox", { name: "Pulse title" })
		.press("Enter");

	// Max takes it, adds proof and sends it for review.
	await maxPage.goto(`/s/${startup.slug}/cycles`);
	await maxPage.getByRole("link", { name: /Cycle 1/ }).click();
	await maxPage.getByRole("button", { name: "Take" }).click();
	const inProgress = maxPage.getByRole("region", { name: "In progress" });
	await inProgress
		.getByRole("button", { name: "Ship billing page", exact: true })
		.click();
	await maxPage.getByRole("button", { name: "Add proof" }).click();
	await maxPage
		.getByRole("dialog")
		.getByLabel("Link")
		.fill("https://github.com/acme/app/pull/7");
	await maxPage
		.getByRole("dialog")
		.getByRole("button", { name: "Add proof" })
		.click();
	await expect(maxPage.getByRole("link", { name: "PR" })).toBeVisible();
	await maxPage.getByRole("button", { name: "Close" }).click();
	await maxPage
		.getByRole("combobox", { name: "Move Ship billing page" })
		.click();
	await maxPage.getByRole("option", { name: "Review" }).click();

	// The Founder sees it in Review live and verifies it.
	const review = founderPage.getByRole("region", { name: "Review" });
	await expect(review.getByText("Max · 1 proof link")).toBeVisible();
	await review
		.getByRole("button", { name: "Ship billing page", exact: true })
		.click();
	await founderPage.getByRole("button", { name: "Verify" }).click();
	await expect(founderPage.getByRole("dialog").getByText("Done")).toBeVisible();
	await founderPage.getByRole("button", { name: "Close" }).click();

	await expect(
		founderPage
			.getByRole("region", { name: "Done" })
			.getByRole("button", { name: "Ship billing page", exact: true }),
	).toBeVisible();
	await maxPage.goto("/my-pulses");
	await expect(
		maxPage.getByRole("heading", { name: "Done · 1" }),
	).toBeVisible();
	await expect(maxPage.getByText("Cycle 1 · 1 proof link")).toBeVisible();
});
