/** The goal to save from what was typed; `null` when it's blank or unchanged. */
export function goalToSave(
	draft: string,
	current: string | null,
): string | null {
	const goal = draft.trim();
	return goal && goal !== current ? goal : null;
}
