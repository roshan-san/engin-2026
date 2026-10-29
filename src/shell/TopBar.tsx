import { Link, useMatches } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { MyRating } from "~/entities/person";
import { placeFromRoute } from "~/entities/place";
import { EnginLogo } from "~/shared/ui/EnginLogo";
import { InviteTray } from "~/shell/InviteTray";
import { AccountMenu } from "~/widgets/account";
import { PlaceSwitcher } from "~/widgets/place-switcher";
import { TabRow } from "~/widgets/tab-row";

/** The signed-in bar: the logo, the place switcher, Explore, your Invites, your Rating and the account menu; the tab row below. */
export function TopBar() {
	const place = useMatches({ select: placeFromRoute });

	return (
		<header className="border-b border-border bg-background">
			<div className="flex h-14 items-center gap-2 px-4 md:px-6">
				<EnginLogo to="/home" />
				<span
					aria-hidden
					className="mx-0.5 h-5 w-px shrink-0 rotate-[20deg] bg-border"
				/>
				<PlaceSwitcher place={place} />
				<div className="flex-1" />
				<Link
					to="/explore"
					aria-label="Explore"
					className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md px-2 text-sm md:h-8 md:min-w-8 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted focus-ring aria-[current=page]:text-foreground"
				>
					<Compass aria-hidden className="size-4 md:hidden" />
					<span className="hidden md:inline">Explore</span>
				</Link>
				<InviteTray />
				<MyRating />
				<AccountMenu />
			</div>
			<TabRow />
		</header>
	);
}
