import { useNavigate } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useInvites } from "~/shell/invites/hooks/useInvites";

/** Your open Invites in the bar: Join or Decline. Nothing when there are none. */
export function InviteTray() {
	const { invites, join, decline } = useInvites();
	const navigate = useNavigate();

	if (!invites || invites.length === 0) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label="Invites"
				className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 data-[state=open]:bg-muted"
			>
				<Mail aria-hidden className="size-4" />
				{invites.length}
			</DropdownMenuTrigger>
			{/* Plain buttons, not menu items, so the tray stays open while an Invite is answered. */}
			<DropdownMenuContent align="end" className="w-80 p-1">
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
							onClick={() => void decline(invite.inviteId)}
						>
							Decline
						</Button>
						<Button
							size="sm"
							onClick={async () => {
								if (await join(invite.inviteId)) {
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
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
