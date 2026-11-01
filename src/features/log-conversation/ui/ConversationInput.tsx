import { CONVERSATION_TEXT } from "@convex/conversations/rules";
import { useState } from "react";
import { Input } from "~/shared/ui/input";

/** Adds one line on Enter. A failed add keeps what was typed, unless more has been typed since. */
export function ConversationInput({
	onAdd,
}: {
	readonly onAdd: (line: string) => Promise<boolean>;
}) {
	const [line, setLine] = useState("");

	return (
		<Input
			aria-label="New conversation"
			placeholder="Who did you talk to, and what did you learn?"
			value={line}
			maxLength={CONVERSATION_TEXT.line}
			autoComplete="off"
			onChange={(event) => setLine(event.target.value)}
			onKeyDown={(event) => {
				if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
				event.preventDefault();
				const next = line.trim();
				if (!next) return;
				setLine("");
				void onAdd(next).then((isAdded) => {
					if (!isAdded) setLine((current) => current || next);
				});
			}}
		/>
	);
}
