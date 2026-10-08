import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { ScoreBadge } from "~/components/shared/ScoreBadge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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
import { useCommands } from "~/shell/command/CommandProvider";
import { useCurrentUser } from "~/shell/hooks/useCurrentUser";
import { ShortcutHint } from "~/shell/shortcuts/ShortcutHint";

type AccountAction = "shortcuts" | "signOut";

export type AccountItem =
	| { readonly label: string; readonly to: "/u/$username" }
	| { readonly label: string; readonly to: "/profile" | "/pricing" }
	| {
			readonly label: string;
			readonly action: AccountAction;
			readonly shortcut?: string;
	  };

/**
 * The account entries, shared by the desktop menu and the phone switcher
 * sheet. "Public profile" shows only once the user has a username.
 */
export const accountItems: readonly AccountItem[] = [
	{ label: "Public profile", to: "/u/$username" },
	{ label: "Edit profile", to: "/profile" },
	{
		label: "Keyboard shortcuts",
		action: "shortcuts",
		shortcut: "shortcuts.open",
	},
	{ label: "Pricing", to: "/pricing" },
	{ label: "Sign out", action: "signOut" },
];

/** The account items this user can see, and how to run the action ones. */
export function useAccountItems() {
	const { user } = useCurrentUser();
	const { signOut } = useAuthActions();
	const { openShortcutSheet } = useCommands();
	const username = user?.username ?? null;

	const items = accountItems.filter(
		(item) => !("to" in item && item.to === "/u/$username") || username,
	);

	function run(action: AccountAction) {
		if (action === "shortcuts") openShortcutSheet();
		else void signOut();
	}

	return { items, username, run };
}

/** Desktop account menu: avatar-only trigger, Score in the header. */
export function AccountMenu() {
	const { user, isLoading } = useCurrentUser();
	const { items, username, run } = useAccountItems();

	if (isLoading || !user) {
		return <Skeleton className="hidden size-8 rounded-full md:block" />;
	}

	const name = user.name ?? "Anonymous";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label="Account"
				className="hidden size-8 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:ml-1 md:flex"
			>
				<Avatar className="size-8 rounded-full">
					{user.image ? <AvatarImage src={user.image} alt="" /> : null}
					<AvatarFallback className="rounded-full text-xs">
						{initials(user.name, user.email)}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60">
				<div className="flex items-start justify-between gap-2 px-2 py-1.5">
					<div className="min-w-0">
						<p className="truncate text-sm font-medium">{name}</p>
						{username ? (
							<p className="truncate text-xs text-muted-foreground">
								@{username}
							</p>
						) : null}
					</div>
					<ScoreBadge score={user.score} />
				</div>
				<DropdownMenuSeparator />
				{items.map((item) => {
					if ("action" in item) {
						return (
							<DropdownMenuItem
								key={item.label}
								className="cursor-pointer"
								onClick={() => run(item.action)}
							>
								{item.label}
								{item.shortcut ? (
									<DropdownMenuShortcut>
										<ShortcutHint id={item.shortcut} />
									</DropdownMenuShortcut>
								) : null}
							</DropdownMenuItem>
						);
					}
					return (
						<DropdownMenuItem key={item.label} asChild>
							{item.to === "/u/$username" ? (
								<Link to="/u/$username" params={{ username: username ?? "" }}>
									{item.label}
								</Link>
							) : (
								<Link to={item.to}>{item.label}</Link>
							)}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
