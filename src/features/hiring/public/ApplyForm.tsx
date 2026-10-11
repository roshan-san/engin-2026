import type { Id } from "@convex/_generated/dataModel";
import { TEXT } from "@convex/lib/limits";
import { type FormEvent, useState } from "react";
import { Kbd } from "~/components/shared/Kbd";
import { MentorNote } from "~/components/shared/MentorNote";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { answerKey } from "./applyStatus";
import { useApply } from "./hooks/useApply";

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

/** "How would you approach this?" Autosaved here until sent. ⌘↵ sends. */
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
		return <p className="text-sm font-medium">Sent.</p>;
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
			<MentorNote>A few lines. How you'd start.</MentorNote>
			<Button type="submit" disabled={!canSend}>
				{isSending ? <Spinner /> : null}
				Send
				<Kbd className="border-primary-foreground/20 text-primary-foreground/60">
					⌘↵
				</Kbd>
			</Button>
		</form>
	);
}
