import { useAuthActions } from "@convex-dev/auth/react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { PersonAvatar } from "~/features/people/PersonAvatar";
import { SettingsSheet } from "~/features/people/settings/SettingsSheet";
import { useMe } from "~/shell/useMe";

/** Your avatar, with your Profile, Settings and Sign out. */
export function AccountMenu() {
	const { signOut } = useAuthActions();
	const me = useMe();
	const [settingsOpen, setSettingsOpen] = useState(false);
	const navigate = useNavigate();
	const router = useRouter();

	// Leave first, so you land on the landing page and a page with unsaved work can ask.
	async function handleSignOut() {
		await navigate({ to: "/" });
		if (router.state.location.pathname !== "/") return;
		await signOut();
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
					<DropdownMenuItem
						className="cursor-pointer"
						onClick={() => void handleSignOut()}
					>
						Sign out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
		</>
	);
}
