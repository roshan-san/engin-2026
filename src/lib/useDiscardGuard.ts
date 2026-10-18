import { useState } from "react";

/**
 * Closing a form sheet with unsaved edits asks first. The form reports whether
 * it has changes through `setIsChanged` (and clears that when it unmounts);
 * `onOpenChange` is what the sheet should call instead of its own.
 */
export function useDiscardGuard(onOpenChange: (open: boolean) => void) {
	const [isChanged, setIsChanged] = useState(false);
	const [isAsking, setIsAsking] = useState(false);

	function guardedOpenChange(open: boolean) {
		if (!open && isChanged) {
			setIsAsking(true);
			return;
		}
		onOpenChange(open);
	}

	function keepEditing() {
		setIsAsking(false);
	}

	function discard() {
		setIsAsking(false);
		onOpenChange(false);
	}

	return {
		isAsking,
		setIsChanged,
		guardedOpenChange,
		keepEditing,
		discard,
	};
}
