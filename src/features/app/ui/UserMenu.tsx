import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { initials } from "~/lib/initials";

type UserMenuProps = {
	readonly name: string;
	readonly email: string | null;
	readonly image: string | null;
	readonly username: string | null;
};

function firstName(name: string) {
	return name.trim().split(/\s+/)[0] ?? name;
}

export function UserMenu({ name, email, image, username }: UserMenuProps) {
	const { signOut } = useAuthActions();
	const displayName = firstName(name);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="group h-8 gap-0 overflow-hidden rounded-full p-0.5 pr-0.5 hover:bg-muted/60 hover:pr-2.5 data-[state=open]:bg-muted/60 data-[state=open]:pr-2.5"
					aria-label={displayName}
				>
					<Avatar className="size-7">
						{image ? <AvatarImage src={image} alt={displayName} /> : null}
						<AvatarFallback className="text-xs">
							{initials(name, email)}
						</AvatarFallback>
					</Avatar>
					<span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 group-hover:ml-1.5 group-hover:max-w-28 group-hover:opacity-100 group-data-[state=open]:ml-1.5 group-data-[state=open]:max-w-28 group-data-[state=open]:opacity-100">
						{displayName}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-44">
				<DropdownMenuItem asChild>
					<Link to="/app/profile">Profile</Link>
				</DropdownMenuItem>
				{username ? (
					<DropdownMenuItem asChild>
						<Link to="/u/$username" params={{ username }}>
							Public profile
						</Link>
					</DropdownMenuItem>
				) : null}
				<DropdownMenuItem asChild>
					<Link to="/app/messages">Messages</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="cursor-pointer"
					onClick={() => void signOut()}
				>
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
