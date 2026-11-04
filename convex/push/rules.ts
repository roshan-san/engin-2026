import { siteUrl } from "../email/rules";

/** Devices one person can hold, oldest dropped past it. */
export const MAX_DEVICES = 10;
const BODY_LIMIT = 140;

export type PushPayload = { title: string; body: string; url: string };

/** A notification from an email: its subject, its first paragraph, and the last link in it to open. */
export function pushPayload(email: {
	subject: string;
	text: string;
}): PushPayload {
	const first = email.text.split(/\n\s*\n/)[0]?.trim() ?? "";
	const body =
		first.length > BODY_LIMIT ? `${first.slice(0, BODY_LIMIT - 1)}…` : first;
	const links = email.text.match(/https?:\/\/\S+/g);
	return {
		title: email.subject,
		body,
		url: links?.at(-1) ?? `${siteUrl()}/home`,
	};
}
