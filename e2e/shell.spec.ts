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

test("a founder switches between Personal, their Startup and Explore on desktop", async ({
	pageAs,
}) => {
	const startup = await founderWithStartup();
	const page = await pageAs(startup.founder);
	const sections = page.getByRole("navigation", { name: "Sections" });

	await page.goto("/my-tasks");
	await expect(
		sections.getByRole("link", { name: "My Tasks" }),
	).toHaveAttribute("aria-current", "page");
	await page.getByRole("button", { name: /Switch workspace/ }).click();
	await page
		.getByRole("menuitem", { name: `Acme ${startup.founder.username}` })
		.click();

	await expect(page).toHaveURL(new RegExp(`/s/${startup.slug}/cycles$`));
	await expect(sections.getByRole("link", { name: "Cycles" })).toHaveAttribute(
		"aria-current",
		"page",
	);
	await page.getByRole("banner").getByRole("link", { name: "Explore" }).click();

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
	await page.getByRole("button", { name: /Switch workspace/ }).click();
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
	await page.getByRole("button", { name: /Switch workspace/ }).click();
	await page
		.getByRole("dialog", { name: "Switch workspace" })
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

test("at tablet widths the top bar stays one row on a Startup page", async ({
	pageAs,
}) => {
	const founder = await signUp("Fay");
	const startup = await startupOf(
		founder,
		"A very long startup name that keeps going on",
	);
	const page = await pageAs(founder);
	const sections = page.getByRole("navigation", { name: "Sections" });

	for (const width of [768, 834]) {
		await page.setViewportSize({ width, height: 1024 });
		await page.goto(`/s/${startup.slug}/cycles`);
		await expect(sections.getByRole("link", { name: "Cycles" })).toBeVisible();

		const header = await page.getByRole("banner").boundingBox();
		const switcher = await page
			.getByRole("button", { name: /Switch workspace/ })
			.boundingBox();
		const bell = await page.getByRole("link", { name: /^Inbox/ }).boundingBox();
		expect(header?.height).toBeLessThanOrEqual(57);
		expect(Math.round(bell?.y ?? -1)).toBe(Math.round(switcher?.y ?? -2));
	}
});

test("someone with no Startups sees no sections on another Startup's page", async ({
	pageAs,
}) => {
	const other = await founderWithStartup();
	const visitor = await signUp("Vic");
	const page = await pageAs(visitor);

	await page.goto(`/s/${other.slug}/cycles`);
	await page
		.getByRole("button", {
			name: "Switch workspace, current: Choose workspace",
		})
		.click();

	const menu = page.getByRole("menu");
	await expect(menu.getByRole("menuitem")).toHaveText([
		/Vic/,
		/Create a Startup/,
	]);
	await expect(page.getByRole("navigation", { name: "Sections" })).toHaveCount(
		0,
	);
});
