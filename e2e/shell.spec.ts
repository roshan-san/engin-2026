import { api } from "../convex/_generated/api";
import { expect, test } from "./support/fixtures";
import { signUp } from "./support/people";
import {
	admit,
	founderWithStartup,
	publishedHackathon,
	startNow,
	startupOf,
} from "./support/world";

test("a founder switches between You, their Startup and Explore on desktop", async ({
	pageAs,
}) => {
	const startup = await founderWithStartup();
	const page = await pageAs(startup.founder);
	const sections = page.getByRole("navigation", { name: "Sections" });

	await page.goto("/my-tasks");
	await expect(
		sections.getByRole("link", { name: "My Tasks" }),
	).toHaveAttribute("aria-current", "page");
	await page.getByRole("button", { name: /Switch context/ }).click();
	await page
		.getByRole("menuitem", { name: `Acme ${startup.founder.username}` })
		.click();

	await expect(page).toHaveURL(new RegExp(`/s/${startup.slug}/cycles$`));
	await expect(sections.getByRole("link", { name: "Cycles" })).toHaveAttribute(
		"aria-current",
		"page",
	);
	await page.getByRole("button", { name: /Switch context/ }).click();
	await page.getByRole("menuitem", { name: "Explore" }).click();

	await expect(page).toHaveURL(/\/explore\/startups$/);
	await expect(
		sections.getByRole("link", { name: "Startups" }),
	).toHaveAttribute("aria-current", "page");
});

test("switching Startup keeps the section the founder is in", async ({
	pageAs,
}) => {
	const acme = await founderWithStartup();
	const beta = await startupOf(acme.founder, `Beta ${acme.founder.username}`);
	const page = await pageAs(acme.founder);

	await page.goto(`/s/${acme.slug}/hiring`);
	await page.getByRole("button", { name: /Switch context/ }).click();
	await page
		.getByRole("menuitem", { name: `Beta ${acme.founder.username}` })
		.click();

	await expect(page).toHaveURL(new RegExp(`/s/${beta.slug}/hiring$`));
	await expect(
		page
			.getByRole("navigation", { name: "Sections" })
			.getByRole("link", { name: "Hiring" }),
	).toHaveAttribute("aria-current", "page");
});

test("on a phone the switcher is a bottom sheet and long names never scroll the page", async ({
	pageAs,
}) => {
	const founder = await signUp("Fay");
	const startup = await startupOf(
		founder,
		"A very long startup name that keeps going on",
	);
	const page = await pageAs(founder);
	await page.setViewportSize({ width: 390, height: 844 });

	await page.goto("/my-tasks");
	await page.getByRole("button", { name: /Switch context/ }).click();
	await page
		.getByRole("dialog", { name: "Switch context" })
		.getByRole("link", { name: "A very long startup name" })
		.click();

	await expect(page).toHaveURL(new RegExp(`/s/${startup.slug}/cycles$`));
	await expect(
		page
			.getByRole("navigation", { name: "Sections" })
			.getByRole("link", { name: "Cycles" }),
	).toHaveAttribute("aria-current", "page");
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(390);
});

test("the bell shows unread news", async ({ pageAs }) => {
	const startup = await founderWithStartup();
	const { hackathonId } = await publishedHackathon(startup);
	const cara = await signUp("Cara");
	await admit(startup, hackathonId, cara);
	startNow(hackathonId);
	await startup.founder.api.mutation(api.hiring.announcements.post, {
		hackathonId,
		body: "Kickoff call at 5pm",
	});
	const page = await pageAs(cara);

	await page.goto("/my-tasks");

	await expect(
		page.getByRole("link", { name: /Inbox, \d+ unread/ }),
	).toBeVisible();
});
