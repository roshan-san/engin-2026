import { useEffect, useRef, useState } from "react";

/**
 * Text being edited next to its saved value. While the field has focus, or
 * while a save is on its way, a changed remote value doesn't overwrite the draft.
 */
export function useDraft(remote: string) {
	const [draft, setDraft] = useState(remote);
	const [isFocused, setIsFocused] = useState(false);
	const awaiting = useRef<string | null>(null);

	useEffect(() => {
		if (isFocused) return;
		if (awaiting.current !== null && remote !== awaiting.current) return;
		awaiting.current = null;
		setDraft(remote);
	}, [remote, isFocused]);

	return {
		draft,
		setDraft,
		setIsFocused,
		/** Note the value being saved, so the old remote value doesn't flash back. */
		expect(value: string) {
			awaiting.current = value;
		},
		/** The save finished, either way. */
		settle() {
			awaiting.current = null;
		},
	};
}
