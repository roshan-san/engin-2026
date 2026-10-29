import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { PersonAvatar } from "~/features/people";
import { displayName } from "~/shared/lib/displayName";
import { orderPresence, presenceLabel } from "./presence";
import { useOnline } from "./useOnline";

/** Overlapping avatars of who is online, you first. Hover for what they're on. */
export function PresenceList({
	startupId,
	slug,
	userId,
}: {
	readonly startupId: Id<"startups">;
	readonly slug: string;
	readonly userId: Id<"users">;
}) {
	const online = useOnline(startupId);
	if (!online || online.length === 0) return null;

	return (
		<TooltipProvider>
			<ul
				data-testid="presence-list"
				aria-label="Online"
				className="flex items-center -space-x-1.5"
			>
				{orderPresence(online, userId).map((entry) => {
					const { user, workingOn } = entry;
					const face = (
						<PersonAvatar
							person={user}
							size={24}
							className="ring-2 ring-background"
						/>
					);
					return (
						<li key={user._id} data-testid="presence-avatar">
							<Tooltip>
								<TooltipTrigger asChild>
									{workingOn ? (
										<Link
											to="/s/$slug/board"
											params={{ slug }}
											search={{ card: workingOn.cardId }}
											aria-label={presenceLabel(entry)}
											className="block rounded-full focus-ring"
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
