import { useLocation } from "@tanstack/react-router";
import { AccountMenu } from "~/shell/account/AccountMenu";
import { currentPlace } from "~/shell/places/places";
import { PlaceSwitcher } from "~/shell/places/PlaceSwitcher";
import { EnginLogo } from "~/shell/topbar/EnginLogo";
import { HackathonCrumb } from "~/shell/topbar/HackathonCrumb";
import { PlaceTabs } from "~/shell/topbar/PlaceTabs";

/** The signed-in bar: the logo, where you are, the tabs there and the account menu. */
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
