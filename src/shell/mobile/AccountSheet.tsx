import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { initials } from "~/lib/initials";
import { ScoreChip } from "~/shell/account/ScoreChip";
import { useCurrentUser } from "~/shell/hooks/useCurrentUser";

type AccountSheetProps = {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
};

/** Mobile account sheet (D-17, E6): avatar/name/username, Score chip, profile links, sign out. */
export function AccountSheet({ open, onOpenChange }: AccountSheetProps) {
	const { user, isLoading } = useCurrentUser();
	const { signOut } = useAuthActions();

	function close() {
		onOpenChange(false);
	}

	const name = user?.name ?? "Anonymous";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="left" className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Account</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col gap-4 px-4 pb-4">
					{isLoading || !user ? (
						<div className="flex items-center gap-2">
							<Skeleton className="size-8 rounded-md" />
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<Skeleton className="h-4 w-24 rounded-md" />
								<Skeleton className="h-3 w-16 rounded-md" />
							</div>
						</div>
					) : (
						<Link
							to={user.username ? "/u/$username" : "/profile"}
							params={user.username ? { username: user.username } : undefined}
							onClick={close}
							className="flex items-center gap-2"
						>
							<Avatar className="size-8">
								{user.image ? (
									<AvatarImage src={user.image} alt={name} />
								) : null}
								<AvatarFallback className="text-xs">
									{initials(user.name, user.email)}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium">{name}</p>
								{user.username ? (
									<p className="truncate text-xs text-muted-foreground">
										@{user.username}
									</p>
								) : null}
							</div>
						</Link>
					)}

					{isLoading || !user ? (
						<Skeleton className="h-6 w-24 rounded-md" />
					) : (
						<ScoreChip score={user.score} />
					)}

					<div className="flex flex-col gap-1 border-t border-border pt-2">
						<Link
							to="/my-hackathons"
							onClick={close}
							className="flex h-11 items-center"
						>
							My Hackathons
						</Link>
						<Link
							to="/profile"
							onClick={close}
							className="flex h-11 items-center"
						>
							Edit profile
						</Link>
						<button
							type="button"
							onClick={() => {
								close();
								void signOut();
							}}
							className="flex h-11 items-center text-left"
						>
							Sign out
						</button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
