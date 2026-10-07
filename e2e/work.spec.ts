import { expect, test } from "./support/fixtures";
import { signUp } from "./support/people";
import { founderWithStartup, join } from "./support/world";

test("a Cycle runs: plan with a goal, start, take a Task, prove it, verify it, see it in My Tasks", async ({
	pageAs,
}) => {
	const startup = await founderWithStartup();
	const max = await signUp("Max");
	await join(startup, max);
	const founderPage = await pageAs(startup.founder);
	const maxPage = await pageAs(max);

	// The Founder plans a Cycle with Max on it, starts it and adds a Task.
	await founderPage.goto(`/s/${startup.slug}/cycles`);
	await founderPage.getByRole("button", { name: "New Cycle" }).click();
	const newCycle = founderPage.getByRole("dialog");
	await newCycle.getByLabel("Title").fill("Cycle 1");
	await newCycle.getByLabel("Starts").fill("2026-10-05");
	await newCycle.getByLabel("Ends").fill("2026-10-19");
	await newCycle.getByRole("button", { name: "Create Cycle" }).click();
	await expect(founderPage.getByText("A Cycle needs a goal")).toBeVisible();
	await newCycle.getByLabel("Goal").fill("Ship self-serve billing");
	await newCycle.getByRole("button", { name: "Create Cycle" }).click();
	await expect(founderPage.getByText("Planned")).toBeVisible();
	await expect(founderPage.getByText("Ship self-serve billing")).toBeVisible();
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
		.getByRole("textbox", { name: "Task title" })
		.fill("Ship billing page");
	await founderPage.getByRole("textbox", { name: "Task title" }).press("Enter");

	// Max takes it; Review refuses it until it has proof.
	await maxPage.goto(`/s/${startup.slug}/cycles`);
	await maxPage.getByRole("link", { name: /Cycle 1/ }).click();
	await maxPage.getByRole("button", { name: "Take" }).click();
	const inProgress = maxPage.getByRole("region", { name: "In progress" });
	await expect(
		inProgress.getByRole("button", { name: "Ship billing page", exact: true }),
	).toBeVisible();
	const grip = maxPage.getByRole("button", { name: "Drag Ship billing page" });
	const reviewColumn = maxPage.getByRole("region", { name: "Review" });
	const from = await grip.boundingBox();
	const to = await reviewColumn.boundingBox();
	if (!from || !to) {
		throw new Error("Board not laid out");
	}
	await maxPage.mouse.move(from.x + 10, from.y + 10);
	await maxPage.mouse.down();
	await maxPage.mouse.move(from.x + 40, from.y + 20, { steps: 5 });
	await maxPage.mouse.move(to.x + to.width / 2, to.y + 40, { steps: 15 });
	await expect(reviewColumn.getByText("Add proof first")).toBeVisible();
	await maxPage.mouse.up();
	await expect(
		inProgress.getByRole("button", { name: "Ship billing page", exact: true }),
	).toBeVisible();

	// Max adds proof and sends it for review.
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
	await maxPage.getByRole("option", { name: "Send for review" }).click();

	// The Founder sees it in Review live and verifies it.
	const review = founderPage.getByRole("region", { name: "Review" });
	await expect(review.getByText("PR · github.com")).toBeVisible();
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
	await maxPage.goto("/my-tasks");
	await expect(
		maxPage.getByRole("heading", { name: "Done · 1" }),
	).toBeVisible();
	await expect(maxPage.getByText(/Cycle 1 · 1 proof link/)).toBeVisible();
});
