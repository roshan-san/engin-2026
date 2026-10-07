import { api } from "../convex/_generated/api";
import { expect, test } from "./support/fixtures";
import { signUp } from "./support/people";
import {
	founderWithStartup,
	publishedHackathon,
	startNow,
} from "./support/world";

test("a hackathon runs from admission to an accepted Offer, ending on the contributor's profile", async ({
	pageAs,
}) => {
	// The whole hiring journey, review loop included, in one test.
	test.slow();
	const startup = await founderWithStartup();
	const { hackathonId, title } = await publishedHackathon(startup);
	const cara = await signUp("Cara");
	await cara.api.mutation(api.hiring.applications.applyToHackathon, {
		hackathonId,
		message: "Keen to build this",
		acceptTerms: true,
	});
	const founderPage = await pageAs(startup.founder);
	const caraPage = await pageAs(cara);
	await founderPage.goto(`/s/${startup.slug}/hackathons/${hackathonId}`);
	await caraPage.goto("/my-hackathons");
	const caraEntry = caraPage.getByRole("listitem").filter({ hasText: title });
	await expect(caraEntry.getByText("Applied")).toBeVisible();

	// Admission: Cara sees it live.
	const applicant = founderPage
		.getByRole("listitem")
		.filter({ hasText: "Keen to build this" });
	await applicant.getByRole("button", { name: "Accept" }).click();
	await expect(caraEntry.getByText("Accepted")).toBeVisible();

	// The hackathon starts; the Founder adds a Starter Task and an announcement.
	startNow(hackathonId);
	await expect(founderPage.getByText("Running")).toBeVisible();
	await founderPage
		.getByRole("textbox", { name: "Starter Task title" })
		.fill("Write tests");
	await founderPage.getByRole("button", { name: "Add Starter Task" }).click();
	await founderPage
		.getByRole("textbox", { name: "Tell every Participant something" })
		.fill("Kickoff call at 5pm");
	await founderPage.getByRole("button", { name: "Post" }).click();

	// Cara works her lane: proof first, then Review.
	await caraPage.goto("/my-tasks");
	await expect(caraPage.getByText("Write tests")).toBeVisible();
	await caraPage.getByRole("link", { name: /Design the flow/ }).click();
	await expect(caraPage.getByText("Kickoff call at 5pm")).toBeVisible();
	await caraPage
		.getByRole("region", { name: "Todo" })
		.getByRole("button", { name: "Design the flow", exact: true })
		.click();
	await caraPage.getByRole("button", { name: "Add proof" }).click();
	await caraPage
		.getByRole("dialog")
		.getByLabel("Link")
		.fill("https://github.com/acme/app/pull/12");
	await caraPage
		.getByRole("dialog")
		.getByRole("button", { name: "Add proof" })
		.click();
	await expect(caraPage.getByRole("link", { name: "PR" })).toBeVisible();
	await caraPage.getByRole("button", { name: "Close" }).click();
	await caraPage
		.getByRole("combobox", { name: "Move Design the flow" })
		.click();
	await caraPage.getByRole("option", { name: "Send for review" }).click();
	await expect(
		caraPage
			.getByRole("region", { name: "Review" })
			.getByText("Waiting for a Founder"),
	).toBeVisible();

	// The Founder verifies it from the Review column, live.
	const review = founderPage.getByRole("region", { name: "Review" });
	await expect(review.getByText("PR · github.com")).toBeVisible();
	await review
		.getByRole("button", { name: "Design the flow", exact: true })
		.click();
	await founderPage.getByRole("button", { name: "Verify" }).click();
	await expect(founderPage.getByRole("dialog").getByText("Done")).toBeVisible();
	await founderPage.getByRole("button", { name: "Close" }).click();
	await expect(review.getByText("Nothing to review")).toBeVisible();
	await expect(
		caraPage
			.getByRole("region", { name: "Done" })
			.getByRole("button", { name: "Design the flow", exact: true }),
	).toBeVisible();

	// The Founder closes with an Offer.
	await founderPage
		.getByRole("button", { name: "Close with Verdicts" })
		.click();
	await founderPage.getByRole("combobox", { name: "Verdict for Cara" }).click();
	await founderPage.getByRole("option", { name: "Passed with Offer" }).click();
	await founderPage
		.getByLabel("Evaluation for Cara")
		.fill("Shipped clean, fast work");
	await founderPage
		.getByRole("button", { name: "Close with Verdicts" })
		.click();
	await founderPage.getByRole("button", { name: "Close Hackathon" }).click();
	await expect(founderPage.getByText("Offer pending")).toBeVisible();

	// Cara accepts; the Founder sees it live.
	await caraPage.goto("/my-hackathons");
	await caraPage.getByRole("button", { name: "Accept" }).click();
	await expect(founderPage.getByText("Offer accepted")).toBeVisible();

	// Cara shows the evaluation on her profile.
	await caraPage.goto("/profile");
	await caraPage.getByRole("button", { name: "Show on profile" }).click();
	await expect(
		caraPage.getByRole("button", { name: "Hide from profile" }),
	).toBeVisible();
	await caraPage.goto(`/u/${cara.username}`);

	await expect(caraPage.getByText("Shipped clean, fast work")).toBeVisible();
	await expect(caraPage.getByText("1 Offers accepted")).toBeVisible();
	// The verified hackathon Task is Proof of Work; the hackathon isn't a completed Cycle.
	await expect(
		caraPage.getByText("1 verified Task · 0 Cycles completed"),
	).toBeVisible();
	await expect(caraPage.getByText("member")).toBeVisible();
});

test("a contributor's profile edits show on their public profile", async ({
	pageAs,
}) => {
	const cara = await signUp("Cara");
	const page = await pageAs(cara);

	await page.goto("/profile");
	await page.getByLabel("Bio").fill("I ship onboarding flows");
	await page.getByLabel("Skills").fill("react, go");
	await page.getByRole("button", { name: "Save profile" }).click();
	await expect(page.getByText("Profile saved")).toBeVisible();
	await page.getByRole("link", { name: "View public profile" }).click();

	await expect(page.getByRole("heading", { name: "Cara" })).toBeVisible();
	await expect(page.getByText("I ship onboarding flows")).toBeVisible();
});
