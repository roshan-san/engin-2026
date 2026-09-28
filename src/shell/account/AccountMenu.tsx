import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { initials } from "~/lib/initials";
import { ScoreChip } from "~/shell/account/ScoreChip";
import { useCommands } from "~/shell/command/CommandProvider";
import { useCurrentUser } from "~/shell/hooks/useCurrentUser";
import { ShortcutHint } from "~/shell/shortcuts/ShortcutHint";

/** Sidebar-footer account menu: avatar/name trigger, Score chip, profile links, sign out. */
export function AccountMenu() {
	const { user, isLoading } = useCurrentUser();
	const { signOut } = useAuthActions();
	const { openShortcutSheet } = useCommands();

	if (isLoading || !user) {
		return <Skeleton className="h-8 w-full rounded-md" />;
	}

	const name = user.name ?? "Anonymous";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-full justify-start gap-2 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
				>
					<Avatar className="size-6">
						{user.image ? <AvatarImage src={user.image} alt={name} /> : null}
						<AvatarFallback className="text-xs">
							{initials(user.name, user.email)}
						</AvatarFallback>
					</Avatar>
					<span className="min-w-0 flex-1 truncate text-left font-medium">
						{name}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				<div className="px-2 py-1.5">
					<p className="truncate text-sm font-medium">{name}</p>
					{user.username ? (
						<p className="truncate text-xs text-muted-foreground">
							@{user.username}
						</p>
					) : null}
				</div>
				<div className="px-2 pb-1.5">
					<ScoreChip score={user.score} />
				</div>
				<DropdownMenuSeparator />
				{user.username ? (
					<DropdownMenuItem asChild>
						<Link to="/u/$username" params={{ username: user.username }}>
							Profile
						</Link>
					</DropdownMenuItem>
				) : null}
				<DropdownMenuItem asChild>
					<Link to="/profile">Edit profile</Link>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="cursor-pointer"
					onClick={openShortcutSheet}
				>
					Keyboard shortcuts
					<DropdownMenuShortcut>
						<ShortcutHint id="shortcuts.open" />
					</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="cursor-pointer"
					onClick={() => void signOut()}
				>
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
