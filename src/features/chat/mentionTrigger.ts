/** The `#query` being typed right before the caret, if any. */
export function findTrigger(text: string, caret: number) {
	const match = text.slice(0, caret).match(/(?:^|\s)#([^\s#]*)$/);
	if (!match) return null;
	return { start: caret - match[1].length - 1, query: match[1] };
}
