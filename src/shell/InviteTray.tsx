import { Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { inviteTitle, useInvites } from "~/shell/useInvites";

/** Your open Invites in the bar: Join or Decline. Nothing when there are none. */
export function InviteTray() {
	const { invites, answering, join, decline } = useInvites();
	const [open, setOpen] = useState(false);

	if (!invites || invites.length === 0) {
		return null;
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				aria-label={`Invites, ${invites.length}`}
				className="flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted focus-ring md:h-8 md:min-w-8"
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
							{inviteTitle(invite)}
						</span>
						<Button
							size="sm"
							variant="ghost"
							disabled={answering === invite.inviteId}
							onClick={() => void decline(invite)}
						>
							Decline
						</Button>
						<Button
							size="sm"
							disabled={answering === invite.inviteId}
							onClick={() => void join(invite, () => setOpen(false))}
						>
							Join
						</Button>
					</div>
				))}
			</PopoverContent>
		</Popover>
	);
}
