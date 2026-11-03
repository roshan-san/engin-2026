import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CONTRIBUTOR_TEXT } from "@convex/contributors/rules";
import { useMutation } from "convex/react";
import { type FormEvent, useState } from "react";
import { attempt } from "~/shared/lib/errors";
import { Button } from "~/shared/ui/button";
import { Input } from "~/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/shared/ui/popover";

/** A Contributor's own label on the Startup, from a small popover. */
export function EditLabelButton({
	startupId,
	label,
}: {
	readonly startupId: Id<"startups">;
	readonly label: string | null;
}) {
	const setMyLabel = useMutation(api.contributors.setMyLabel);
	const [isOpen, setIsOpen] = useState(false);
	const [text, setText] = useState(label ?? "");
	const [isSaving, setIsSaving] = useState(false);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (isSaving) return;
		setIsSaving(true);
		const saved = await attempt(() => setMyLabel({ startupId, label: text }));
		setIsSaving(false);
		if (saved) setIsOpen(false);
	}

	function toggle(open: boolean) {
		// Reopening starts from what's saved, not an abandoned edit.
		if (open) setText(label ?? "");
		setIsOpen(open);
	}

	return (
		<Popover open={isOpen} onOpenChange={toggle}>
			<PopoverTrigger asChild>
				<Button size="sm" variant="ghost">
					Edit label
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80">
				<form onSubmit={submit} className="flex gap-2">
					<Input
						aria-label="Your label"
						placeholder="Growth lead"
						maxLength={CONTRIBUTOR_TEXT.label}
						value={text}
						onChange={(event) => setText(event.target.value)}
					/>
					<Button type="submit" disabled={isSaving}>
						Save
					</Button>
				</form>
			</PopoverContent>
		</Popover>
	);
}
