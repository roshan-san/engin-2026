import { Link } from "@tanstack/react-router";
import { GoogleButton } from "~/features/people";
import { EnginLogo } from "~/shared/ui/EnginLogo";

/** The signed-out bar: the logo, Explore and a sign-in button. */
export function PublicHeader() {
	return (
		<header className="shrink-0 border-b border-border bg-background">
			<div className="flex h-14 items-center gap-1 px-4 md:px-6">
				<EnginLogo />
				<div className="flex-1" />
				<Link
					to="/explore"
					className="flex h-9 items-center rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-ring md:h-8"
				>
					Explore
				</Link>
				<GoogleButton
					variant="default"
					size="sm"
					className="ml-2 whitespace-nowrap"
				/>
			</div>
		</header>
	);
}
