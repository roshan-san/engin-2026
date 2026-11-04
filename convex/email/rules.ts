import { type Infer, v } from "convex/values";

export const emailKind = v.union(
	v.literal("accepted"),
	v.literal("starting_tomorrow"),
	v.literal("not_this_time"),
	v.literal("not_selected"),
	v.literal("offer"),
	v.literal("team_invite"),
	v.literal("card_sent_back"),
	v.literal("new_applicants"),
	v.literal("decision_deadline"),
	v.literal("monday_reminder"),
	v.literal("thread_message"),
	v.literal("place_released"),
	v.literal("removed"),
);
export type EmailKind = Infer<typeof emailKind>;

/** The app's address, for links in emails. */
export function siteUrl(): string {
	return process.env.SITE_URL ?? "http://localhost:3000";
}

/** The backend's address, where the unsubscribe route lives. */
export function backendSiteUrl(): string {
	return process.env.CONVEX_SITE_URL ?? "http://localhost:3211";
}

export function unsubscribeUrl(token: string): string {
	return `${backendSiteUrl()}/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** The email's text with its unsubscribe line, which every email ends with. */
export function withFooter(text: string, token: string): string {
	return `${text}\n\n— engin\nUnsubscribe: ${unsubscribeUrl(token)}`;
}

export type SendingSettings = {
	from: string;
	replyTo: string[];
	testMode: boolean;
};

/**
 * How live email goes out, from the deployment's env: null (log only) without both
 * RESEND_API_KEY and EMAIL_FROM. Replies go to EMAIL_REPLY_TO, else back to EMAIL_FROM,
 * so they land in the mailbox behind it (a Hostinger inbox, say).
 */
export function sendingSettings(
	env: Record<string, string | undefined>,
): SendingSettings | null {
	const from = env.EMAIL_FROM;
	if (!env.RESEND_API_KEY || !from) {
		return null;
	}
	return {
		from,
		replyTo: [env.EMAIL_REPLY_TO || from],
		testMode: env.EMAIL_TEST_MODE !== "false",
	};
}
