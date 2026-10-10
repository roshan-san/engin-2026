import { AccountMenu } from "~/shell/account/AccountMenu";
import { EnginLogo } from "~/shell/topbar/EnginLogo";
import { PlaceTabs } from "~/shell/topbar/PlaceTabs";

/** The signed-in bar: the logo, the Startup you are in and the account menu. */
export function TopBar() {
	return (
		<header className="border-b border-border bg-background">
			<div className="flex h-14 items-center gap-2 px-4 md:px-6">
				<EnginLogo />
				<PlaceTabs />
				<div className="flex-1" />
				<AccountMenu />
			</div>
		</header>
	);
}
