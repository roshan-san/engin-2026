import type { Id } from "@convex/_generated/dataModel";
import { TEXT } from "@convex/shared/limits";
import { type FormEvent, useState } from "react";
import { isMac } from "~/shared/lib/platform";
import { Button } from "~/shared/ui/button";
import { CharCount } from "~/shared/ui/CharCount";
import { Kbd } from "~/shared/ui/Kbd";
import { Label } from "~/shared/ui/label";
import { MentorNote } from "~/shared/ui/MentorNote";
import { Spinner } from "~/shared/ui/spinner";
import { Textarea } from "~/shared/ui/textarea";
import { answerKey } from "./applyStatus";
import { useApply } from "./useApply";

function readSaved(key: string): string {
	try {
		return localStorage.getItem(key) ?? "";
	} catch {
		return "";
	}
}

function save(key: string, text: string) {
	try {
		if (text) localStorage.setItem(key, text);
		else localStorage.removeItem(key);
	} catch {
		// Private browsing: the answer just isn't kept.
	}
}

/** "How would you approach this?" Autosaved here until sent. ⌘↵ (Ctrl ↵ off Mac) sends. */
export function ApplyForm({
	hackathonId,
}: {
	readonly hackathonId: Id<"hackathons">;
}) {
	const key = answerKey(hackathonId);
	const apply = useApply(hackathonId);
	const [answer, setAnswer] = useState(() => readSaved(key));
	const [isSending, setIsSending] = useState(false);
	const [isSent, setIsSent] = useState(false);
	const canSend = answer.trim().length > 0 && !isSending;

	async function send(event?: FormEvent) {
		event?.preventDefault();
		if (!canSend) return;
		setIsSending(true);
		const isApplied = await apply(answer.trim());
		setIsSending(false);
		if (isApplied) {
			save(key, "");
			setIsSent(true);
		}
	}

	if (isSent) {
		return <p className="text-sm font-medium">Applied.</p>;
	}

	return (
		<form onSubmit={send} className="flex flex-col gap-2.5">
			<Label htmlFor="apply-answer">How would you approach this?</Label>
			<Textarea
				id="apply-answer"
				value={answer}
				maxLength={TEXT.answer}
				className="min-h-32"
				onChange={(e) => {
					setAnswer(e.target.value);
					save(key, e.target.value);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
						e.preventDefault();
						void send();
					}
				}}
			/>
			<CharCount value={answer} max={TEXT.answer} />
			<MentorNote>
				{answer.trim().length === 0
					? "Write your answer to send"
					: "A few lines. How you'd start."}
			</MentorNote>
			<Button type="submit" disabled={!canSend}>
				{isSending ? <Spinner /> : null}
				Send
				<Kbd className="border-primary-foreground/20 text-primary-foreground/60">
					{isMac() ? "⌘↵" : "Ctrl ↵"}
				</Kbd>
			</Button>
		</form>
	);
}
