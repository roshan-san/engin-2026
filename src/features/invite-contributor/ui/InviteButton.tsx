import { type FormEvent, useState } from "react";
import { DISCIPLINES, type Discipline } from "~/shared/config/disciplines";
import { Button } from "~/shared/ui/button";
import { ChipPicker } from "~/shared/ui/ChipPicker";
import { Input } from "~/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/shared/ui/popover";

/** The page bar's Invite: the Founder invites by email from a small popover. */
export function InviteButton({
	onSend,
}: {
	/** Resolves `true` once sent (the error is shown already otherwise). */
	readonly onSend: (email: string, discipline: Discipline) => Promise<boolean>;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [discipline, setDiscipline] = useState<Discipline | null>(null);
	const [isSending, setIsSending] = useState(false);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!email.trim() || !discipline || isSending) return;
		setIsSending(true);
		if (await onSend(email, discipline)) {
			setEmail("");
			setDiscipline(null);
			setIsOpen(false);
		}
		setIsSending(false);
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button size="sm">Invite</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80">
				<form onSubmit={submit} className="flex flex-col gap-3">
					<Input
						type="email"
						aria-label="Email"
						placeholder="name@company.com"
						autoComplete="off"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
					<ChipPicker
						label="Discipline"
						options={DISCIPLINES}
						value={discipline}
						onChange={setDiscipline}
					/>
					<Button
						type="submit"
						disabled={!email.trim() || !discipline || isSending}
					>
						Send
					</Button>
					<p className="text-xs text-muted-foreground">
						They'll see it under Invites when they sign in to engin with this
						email.
					</p>
				</form>
			</PopoverContent>
		</Popover>
	);
}
