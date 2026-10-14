import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { AccountMenu } from "~/shell/AccountMenu";
import { EnginLogo } from "~/shell/EnginLogo";
import { InviteTray } from "~/shell/InviteTray";
import { MyRating } from "~/shell/MyRating";
import { PlaceSwitcher } from "~/shell/PlaceSwitcher";
import { StartupTabs } from "~/shell/StartupTabs";
import { useCurrentPlace } from "~/shell/useCurrentPlace";

/** The signed-in bar: the logo, the place switcher, Explore, your Invites, your Rating and the account menu; inside a Startup, its tabs below. */
export function TopBar() {
	const place = useCurrentPlace();

	return (
		<header className="border-b border-border bg-background">
			<div className="flex h-14 items-center gap-2 px-4 md:px-6">
				<EnginLogo />
				<PlaceSwitcher place={place} />
				<div className="flex-1" />
				<Link
					to="/explore"
					aria-label="Explore"
					className="flex h-8 shrink-0 items-center rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
				>
					<Compass aria-hidden className="size-4 md:hidden" />
					<span className="hidden md:inline">Explore</span>
				</Link>
				<InviteTray />
				<MyRating />
				<AccountMenu />
			</div>
			{place?.kind === "startup" ? <StartupTabs slug={place.slug} /> : null}
		</header>
	);
}
