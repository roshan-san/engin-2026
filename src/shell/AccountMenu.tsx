import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMe } from "~/entities/person";
import { SettingsSheet } from "~/features/people";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/shared/ui/dropdown-menu";
import { PersonAvatar } from "~/shared/ui/PersonAvatar";

/** Your avatar, with your Profile, Settings and Sign out. */
export function AccountMenu() {
	const me = useMe();
	const [settingsOpen, setSettingsOpen] = useState(false);
	const navigate = useNavigate();

	// Go to the landing page, which signs you out on arrival. A page with
	// unsaved work can stop the trip, and then you stay signed in.
	function handleSignOut() {
		void navigate({ to: "/", state: { signingOut: true } });
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label="Account"
					className="shrink-0 rounded-full focus-ring"
				>
					<PersonAvatar
						person={
							me && { name: me.name ?? me.email ?? null, image: me.image }
						}
						size={32}
					/>
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
					<DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
						Sign out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
		</>
	);
}
