import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { SettingsSheet } from "~/features/people/settings/SettingsSheet";
import { initials } from "~/lib/initials";
import { useMe } from "~/shell/hooks/useMe";

/** Your avatar, with your Profile, Settings and Sign out. */
export function AccountMenu() {
	const { signOut } = useAuthActions();
	const me = useMe();
	const [settingsOpen, setSettingsOpen] = useState(false);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label="Account"
					className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				>
					<Avatar className="size-8 rounded-full">
						{me?.image ? <AvatarImage src={me.image} alt="" /> : null}
						<AvatarFallback className="rounded-full text-xs">
							{initials(me?.name ?? null, me?.email ?? null)}
						</AvatarFallback>
					</Avatar>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-40">
					{me?.username ? (
						<DropdownMenuItem asChild className="cursor-pointer">
							<Link to="/u/$username" params={{ username: me.username }}>
								Profile
							</Link>
						</DropdownMenuItem>
					) : null}
					<DropdownMenuItem
						className="cursor-pointer"
						onSelect={() => setSettingsOpen(true)}
					>
						Settings
					</DropdownMenuItem>
					<DropdownMenuItem
						className="cursor-pointer"
						onClick={() => void signOut()}
					>
						Sign out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
		</>
	);
}
