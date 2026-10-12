import { Link, useLocation } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { AccountMenu } from "~/shell/AccountMenu";
import { InviteTray } from "~/shell/InviteTray";
import { currentPlace } from "~/shell/places";
import { PlaceSwitcher } from "~/shell/PlaceSwitcher";
import { EnginLogo } from "~/shell/EnginLogo";
import { HackathonCrumb } from "~/shell/HackathonCrumb";
import { PlaceTabs } from "~/shell/PlaceTabs";

/** The signed-in bar: the logo, where you are, the tabs there, Explore, your Invites and the account menu. */
export function TopBar() {
	const inStartup = currentPlace(useLocation().pathname)?.kind === "startup";

	return (
		<header className="border-b border-border bg-background">
			<div className="flex h-14 items-center gap-2 px-4 md:px-6">
				<EnginLogo />
				<PlaceSwitcher />
				<div className="hidden h-full items-center gap-2 md:flex">
					<PlaceTabs />
					<HackathonCrumb />
				</div>
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
				<AccountMenu />
			</div>
			{inStartup ? (
				<div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap border-t border-border px-4 md:hidden">
					<PlaceTabs />
					<HackathonCrumb />
				</div>
			) : null}
		</header>
	);
}
