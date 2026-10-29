/** A Card mention in a message body: `#card:<cardId>`. Global: read it with matchAll. */
export const CARD_MENTION = /#card:([a-z0-9]+)/g;

export type BodyPart =
	| { kind: "text"; text: string }
	| { kind: "mention"; cardId: string };

export function mentionToken(cardId: string): string {
	return `#card:${cardId}`;
}

/** The Card ids mentioned in `body`, each once, in order of first mention. */
export function parseMentions(body: string): string[] {
	const ids = new Set<string>();
	for (const match of body.matchAll(CARD_MENTION)) {
		ids.add(match[1]);
	}
	return [...ids];
}

/** `body` as text and mention parts in order, with no empty text parts. */
export function splitBody(body: string): BodyPart[] {
	const parts: BodyPart[] = [];
	let from = 0;
	for (const match of body.matchAll(CARD_MENTION)) {
		if (match.index > from) {
			parts.push({ kind: "text", text: body.slice(from, match.index) });
		}
		parts.push({ kind: "mention", cardId: match[1] });
		from = match.index + match[0].length;
	}
	if (from < body.length) {
		parts.push({ kind: "text", text: body.slice(from) });
	}
	return parts;
}

export const MAX_MESSAGES = 100;
export const MAX_MESSAGE_IMAGES = 4;
export const MAX_MESSAGE_MENTIONS = 10;

/** Longest allowed text per Message field. */
export const MESSAGE_TEXT = { body: 2000 };
