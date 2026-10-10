import { useAuthActions } from "@convex-dev/auth/react";
import { UserRound } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

/** The account menu: for now, just sign out. */
export function AccountMenu() {
	const { signOut } = useAuthActions();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label="Account"
				className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
			>
				<UserRound aria-hidden className="size-4" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-40">
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
