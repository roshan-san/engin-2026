import { AccountMenu } from "~/shell/account/AccountMenu";
import { EnginLogo } from "~/shell/topbar/EnginLogo";

/** The signed-in bar: the logo and the account menu. */
export function TopBar() {
	return (
		<header className="border-b border-border bg-background">
			<div className="flex h-14 items-center gap-2 px-4 md:px-6">
				<EnginLogo />
				<div className="flex-1" />
				<AccountMenu />
			</div>
		</header>
	);
}
