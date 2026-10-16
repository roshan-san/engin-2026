import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { useInvites } from "~/shell/useInvites";

/** Your open Invites in the bar: Join or Decline. Nothing when there are none. */
export function InviteTray() {
	const { invites, join, decline } = useInvites();
	const navigate = useNavigate();
	const [answering, setAnswering] = useState<Id<"invites"> | null>(null);

	if (!invites || invites.length === 0) {
		return null;
	}

	/** Disables the row's buttons while its answer is in flight. */
	async function answer(
		inviteId: Id<"invites">,
		action: () => Promise<boolean>,
	) {
		setAnswering(inviteId);
		try {
			return await action();
		} finally {
			setAnswering(null);
		}
	}

	return (
		<Popover>
			<PopoverTrigger
				aria-label="Invites"
				className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted focus-ring"
			>
				<Mail aria-hidden className="size-4" />
				{invites.length}
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 p-1">
				{invites.map((invite) => (
					<div
						key={invite.inviteId}
						className="flex items-center gap-2 rounded-sm px-2 py-1.5"
					>
						<span className="min-w-0 flex-1 truncate text-sm">
							{invite.fromHackathon
								? `Hired at ${invite.startupName}`
								: `${invite.startupName} invited you`}
						</span>
						<Button
							size="sm"
							variant="ghost"
							disabled={answering === invite.inviteId}
							onClick={() =>
								void answer(invite.inviteId, () => decline(invite.inviteId))
							}
						>
							Decline
						</Button>
						<Button
							size="sm"
							disabled={answering === invite.inviteId}
							onClick={async () => {
								if (
									await answer(invite.inviteId, () => join(invite.inviteId))
								) {
									await navigate({
										to: "/s/$slug/board",
										params: { slug: invite.slug },
									});
								}
							}}
						>
							Join
						</Button>
					</div>
				))}
			</PopoverContent>
		</Popover>
	);
}
