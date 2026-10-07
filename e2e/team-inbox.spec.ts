import { api } from "../convex/_generated/api";
import { expect, test } from "./support/fixtures";
import { signUp } from "./support/people";
import {
	admit,
	founderWithStartup,
	publishedHackathon,
	startNow,
} from "./support/world";

test("a Founder invites a teammate, who accepts from their Inbox", async ({
	pageAs,
}) => {
	const startup = await founderWithStartup();
	const zed = await signUp("Zed");
	const founderPage = await pageAs(startup.founder);
	const zedPage = await pageAs(zed);

	await founderPage.goto(`/s/${startup.slug}/team`);
	await founderPage
		.getByRole("textbox", { name: "@username or teammate@email.com" })
		.fill(`@${zed.username}`);
	await founderPage.getByRole("button", { name: "Send invite" }).click();
	await expect(founderPage.getByText(zed.email)).toBeVisible();
	await zedPage.goto("/inbox");
	const invite = zedPage
		.getByRole("listitem")
		.filter({ hasText: "invited you to" });
	await invite.getByRole("button", { name: "Accept" }).click();

	await expect(invite).toBeHidden();
	await expect(
		founderPage.getByRole("listitem").filter({
			has: founderPage.getByRole("link", { name: `@${zed.username}` }),
		}),
	).toContainText("Member");
	await founderPage.goto(`/s/${startup.slug}/activity`);
	await expect(founderPage.getByText("Zed joined the team")).toBeVisible();
});

test("an announcement reaches a Participant's Inbox and Threads", async ({
	pageAs,
}) => {
	const startup = await founderWithStartup();
	const { hackathonId, title } = await publishedHackathon(startup);
	const cara = await signUp("Cara");
	await admit(startup, hackathonId, cara);
	startNow(hackathonId);
	await startup.founder.api.mutation(api.hiring.announcements.post, {
		hackathonId,
		body: "Kickoff call at 5pm",
	});
	const page = await pageAs(cara);

	await page.goto("/inbox");
	await expect(
		page.getByRole("link", { name: `New announcement in ${title}` }),
	).toBeVisible();
	await page.getByRole("button", { name: "Mark all read" }).click();
	await expect(
		page.getByRole("heading", { name: "Notifications", exact: true }),
	).toBeVisible();
	await page.goto("/threads");
	await page.getByRole("link", { name: new RegExp(title) }).click();

	await expect(page.getByRole("heading", { name: title })).toBeVisible();
	await expect(page.getByText("Kickoff call at 5pm")).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Open Hackathon" }),
	).toBeVisible();
});
