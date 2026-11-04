import { Resend } from "@convex-dev/resend";
import { components } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { normalizeEmail } from "../invites/model";
import { pushToUser } from "../push/model";
import { notSelectedEmail } from "./copy";
import {
	type EmailKind,
	type SendingSettings,
	sendingSettings,
	siteUrl,
	unsubscribeUrl,
	withFooter,
} from "./rules";

export type Email = {
	to: string;
	kind: EmailKind;
	subject: string;
	text: string;
	dedupeKey?: string;
};

/** Resend and its settings when live sending is configured; else emails are only logged (tests, local, previews). */
function resendIfConfigured(): {
	resend: Resend;
	settings: SendingSettings;
} | null {
	const settings = sendingSettings(process.env);
	return settings
		? {
				resend: new Resend(components.resend, { testMode: settings.testMode }),
				settings,
			}
		: null;
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
	return (await deliver(ctx, email)) === "sent" ? "sent" : "skipped";
}

async function deliver(
	ctx: MutationCtx,
	email: Email,
): Promise<"sent" | "duplicate" | "opted_out" | "no_address"> {
	const to = normalizeEmail(email.to);
	if (!to) {
		return "no_address";
	}
	if (email.dedupeKey) {
		const key = email.dedupeKey;
		const sent = await ctx.db
			.query("emails")
			.withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", key))
			.first();
		if (sent) {
			return "duplicate";
		}
	}
	const prefs = await ensurePrefs(ctx, to);
	if (prefs.optedOut) {
		// Logged with no text, so the dedupeKey still holds for push.
		if (email.dedupeKey) {
			await ctx.db.insert("emails", {
				to,
				kind: email.kind,
				subject: email.subject,
				text: "",
				dedupeKey: email.dedupeKey,
				status: "logged",
			});
		}
		return "opted_out";
	}

	const text = withFooter(email.text, prefs.token);
	const live = resendIfConfigured();
	if (live) {
		await live.resend.sendEmail(ctx, {
			from: live.settings.from,
			replyTo: live.settings.replyTo,
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

/**
 * Tells a user: by email to their sign-in address, and by push to their devices.
 * Opting out of email leaves push on; a repeated `dedupeKey` sends neither.
 */
export async function emailUser(
	ctx: MutationCtx,
	userId: Id<"users">,
	email: Omit<Email, "to">,
): Promise<"sent" | "skipped"> {
	const user = await ctx.db.get(userId);
	const result = user?.email
		? await deliver(ctx, { ...email, to: user.email })
		: "no_address";
	if (result !== "duplicate") {
		await pushToUser(ctx, userId, email);
	}
	return result === "sent" ? "sent" : "skipped";
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
