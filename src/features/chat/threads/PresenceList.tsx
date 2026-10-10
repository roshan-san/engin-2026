import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { displayName } from "~/features/work/cards/displayName";
import { initials } from "~/lib/initials";
import { usePresence } from "./hooks/usePresence";
import { orderPresence, presenceLabel } from "./presence";

/** Overlapping avatars of who is online, you first. Hover for what they're on. */
export function PresenceList() {
	const { startup, userId } = useWorkspace();
	const online = usePresence(startup._id);
	if (!online || online.length === 0) return null;

	return (
		<TooltipProvider>
			<ul
				data-testid="presence-list"
				className="flex items-center -space-x-2 px-4 pt-3"
			>
				{orderPresence(online, userId).map((entry) => {
					const { user, workingOn } = entry;
					const face = (
						<Avatar className="size-7 ring-2 ring-background">
							{user.image ? <AvatarImage src={user.image} alt="" /> : null}
							<AvatarFallback className="text-[10px]">
								{initials(user.name, user.username)}
							</AvatarFallback>
						</Avatar>
					);
					return (
						<li key={user._id} data-testid="presence-avatar">
							<Tooltip>
								<TooltipTrigger asChild>
									{workingOn ? (
										<Link
											to="/s/$slug/board"
											params={{ slug: startup.slug }}
											search={{ card: workingOn.cardId }}
											aria-label={presenceLabel(entry)}
											className="block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
										>
											{face}
										</Link>
									) : (
										<span
											role="img"
											aria-label={displayName(user)}
											className="block rounded-full"
										>
											{face}
										</span>
									)}
								</TooltipTrigger>
								<TooltipContent side="bottom">
									{presenceLabel(entry)}
								</TooltipContent>
							</Tooltip>
						</li>
					);
				})}
			</ul>
		</TooltipProvider>
	);
}
