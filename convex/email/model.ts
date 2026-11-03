import { Resend } from "@convex-dev/resend";
import { components } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { normalizeEmail } from "../invites/model";
import { notSelectedEmail } from "./copy";
import { type EmailKind, siteUrl, unsubscribeUrl, withFooter } from "./rules";

export type Email = {
	to: string;
	kind: EmailKind;
	subject: string;
	text: string;
	dedupeKey?: string;
};

/** Live sending needs both; without them emails are only logged (tests, local, previews). */
function resendIfConfigured(): { resend: Resend; from: string } | null {
	const from = process.env.EMAIL_FROM;
	if (!process.env.RESEND_API_KEY || !from) {
		return null;
	}
	return {
		resend: new Resend(components.resend, {
			testMode: process.env.EMAIL_TEST_MODE !== "false",
		}),
		from,
	};
}

/** The address's prefs, made with a fresh unsubscribe token the first time. */
async function ensurePrefs(
	ctx: MutationCtx,
	email: string,
): Promise<Doc<"emailPrefs">> {
	const existing = await ctx.db
		.query("emailPrefs")
		.withIndex("by_email", (q) => q.eq("email", email))
		.unique();
	if (existing) {
		return existing;
	}
	const id = await ctx.db.insert("emailPrefs", {
		email,
		token: crypto.randomUUID(),
		optedOut: false,
	});
	const created = await ctx.db.get(id);
	if (!created) {
		throw new Error("emailPrefs insert vanished");
	}
	return created;
}

/**
 * Sends one email, never throwing for it: skipped when the address opted out or the
 * `dedupeKey` was already sent. Every email ends with its unsubscribe link.
 */
export async function sendEmail(
	ctx: MutationCtx,
	email: Email,
): Promise<"sent" | "skipped"> {
	const to = normalizeEmail(email.to);
	if (!to) {
		return "skipped";
	}
	if (email.dedupeKey) {
		const key = email.dedupeKey;
		const sent = await ctx.db
			.query("emails")
			.withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", key))
			.first();
		if (sent) {
			return "skipped";
		}
	}
	const prefs = await ensurePrefs(ctx, to);
	if (prefs.optedOut) {
		return "skipped";
	}

	const text = withFooter(email.text, prefs.token);
	const live = resendIfConfigured();
	if (live) {
		await live.resend.sendEmail(ctx, {
			from: live.from,
			to,
			subject: email.subject,
			text,
			headers: [
				{ name: "List-Unsubscribe", value: `<${unsubscribeUrl(prefs.token)}>` },
				{ name: "List-Unsubscribe-Post", value: "List-Unsubscribe=One-Click" },
			],
		});
	}
	await ctx.db.insert("emails", {
		to,
		kind: email.kind,
		subject: email.subject,
		text,
		dedupeKey: email.dedupeKey,
		status: live ? "queued" : "logged",
	});
	return "sent";
}

/** `sendEmail` to a user's sign-in address; skipped when they have none. */
export async function emailUser(
	ctx: MutationCtx,
	userId: Id<"users">,
	email: Omit<Email, "to">,
): Promise<"sent" | "skipped"> {
	const user = await ctx.db.get(userId);
	if (!user?.email) {
		return "skipped";
	}
	return await sendEmail(ctx, { ...email, to: user.email });
}

/** The names a Hackathon email needs. */
export async function hackathonNames(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
): Promise<{ startupName: string; jobTitle: string; slug: string }> {
	const startup = await ctx.db.get(hackathon.startupId);
	return {
		startupName: startup?.name ?? "A startup",
		jobTitle: hackathon.job.title,
		slug: startup?.slug ?? "",
	};
}

/** "Not selected for this one", for an Applicant the Founder declined or the start passed over. */
export async function emailNotSelected(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	userId: Id<"users">,
): Promise<void> {
	await emailUser(ctx, userId, {
		kind: "not_selected",
		dedupeKey: `not_selected:${hackathon._id}:${userId}`,
		...notSelectedEmail({
			...(await hackathonNames(ctx, hackathon)),
			url: `${siteUrl()}/explore/hackathons`,
		}),
	});
}
