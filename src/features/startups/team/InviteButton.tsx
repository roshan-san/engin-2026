import { type FormEvent, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";

/** The page bar's Invite: the Founder invites by email from a small popover. */
export function InviteButton({
	onSend,
}: {
	/** Resolves `true` once sent (the error is shown already otherwise). */
	readonly onSend: (email: string) => Promise<boolean>;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [isSending, setIsSending] = useState(false);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!email.trim() || isSending) return;
		setIsSending(true);
		if (await onSend(email)) {
			setEmail("");
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
				<form onSubmit={submit} className="flex flex-col gap-2">
					<div className="flex gap-2">
						<Input
							type="email"
							aria-label="Email"
							placeholder="name@company.com"
							autoComplete="off"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
						<Button type="submit" disabled={!email.trim() || isSending}>
							Send
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						They'll see it under Invites when they sign in to engin with this
						email.
					</p>
				</form>
			</PopoverContent>
		</Popover>
	);
}
