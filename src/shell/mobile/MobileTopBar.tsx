import { useMatches } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { initials } from "~/lib/initials";
import { useCurrentUser } from "~/shell/hooks/useCurrentUser";
import { AccountSheet } from "~/shell/mobile/AccountSheet";
import { SCREEN_TITLES } from "~/shell/nav";

/**
 * Slim mobile top bar (D-17, E5): the avatar opens the account sheet, the
 * screen title is centred and truncates between the two 44px columns. The
 * right-hand 44px slot keeps the title centred; plan 01-09 fills it with the
 * command palette's search button.
 */
export function MobileTopBar() {
	const { user, isLoading } = useCurrentUser();
	const matches = useMatches();
	const [accountOpen, setAccountOpen] = useState(false);

	const routeId = matches.at(-1)?.routeId;
	const title = (routeId ? SCREEN_TITLES[routeId] : undefined) ?? "Engin";
	const name = user?.name ?? "Anonymous";

	return (
		<>
			<header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background px-2 md:hidden">
				<button
					type="button"
					aria-label="Account"
					onClick={() => setAccountOpen(true)}
					className="flex size-11 shrink-0 items-center justify-center"
				>
					<Avatar className="size-8">
						{!isLoading && user?.image ? (
							<AvatarImage src={user.image} alt={name} />
						) : null}
						<AvatarFallback className="text-xs">
							{isLoading || !user
								? initials(null, null)
								: initials(user.name, user.email)}
						</AvatarFallback>
					</Avatar>
				</button>
				<h1 className="min-w-0 flex-1 truncate text-center text-xl font-semibold">
					{title}
				</h1>
				<div className="size-11 shrink-0" />
			</header>
			<AccountSheet open={accountOpen} onOpenChange={setAccountOpen} />
		</>
	);
}
