import { type FormEvent, useState } from "react";
import { Row, RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { dayLabel } from "~/features/hiring/hackathonDates";
import type { StartupInvite } from "./hooks/useStartupInvites";

/** The Founder invites by email; pending Invites sit below with Revoke. */
export function InviteForm({
	invites,
	onSend,
	onRevoke,
}: {
	readonly invites: StartupInvite[] | undefined;
	/** Resolves `true` once sent (the error is shown already otherwise). */
	readonly onSend: (email: string) => Promise<boolean>;
	readonly onRevoke: (invite: StartupInvite) => Promise<void>;
}) {
	const [email, setEmail] = useState("");
	const [isSending, setIsSending] = useState(false);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!email.trim() || isSending) return;
		setIsSending(true);
		if (await onSend(email)) setEmail("");
		setIsSending(false);
	}

	return (
		<section className="flex flex-col gap-3">
			<SectionLabel>Invites</SectionLabel>
			<form onSubmit={submit} className="flex gap-2">
				<Input
					type="email"
					aria-label="Email"
					placeholder="name@company.com"
					autoComplete="off"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
				/>
				<Button type="submit" disabled={!email.trim() || isSending}>
					Invite
				</Button>
			</form>
			{invites === undefined ? (
				<div className="flex flex-col gap-2">
					<Skeleton className="h-9" />
					<Skeleton className="h-9" />
				</div>
			) : invites.length > 0 ? (
				<RowList>
					{invites.map((invite) => (
						<Row
							key={invite.inviteId}
							title={invite.email}
							meta={`expires ${dayLabel(invite.expiresAt)}`}
							trailing={
								<div className="flex items-center gap-3">
									{invite.fromHackathon ? (
										<Badge variant="outline">Hired</Badge>
									) : null}
									<Button
										variant="ghost"
										size="sm"
										className="text-muted-foreground"
										onClick={() => void onRevoke(invite)}
									>
										Revoke
									</Button>
								</div>
							}
						/>
					))}
				</RowList>
			) : null}
		</section>
	);
}
