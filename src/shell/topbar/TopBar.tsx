import { Search } from "lucide-react";
import { AccountMenu } from "~/shell/account/AccountMenu";
import { useCommands } from "~/shell/command/CommandProvider";
import { useShellContext } from "~/shell/hooks/useShellContext";
import { ShortcutHint } from "~/shell/shortcuts/ShortcutHint";
import { BellLink } from "~/shell/topbar/BellLink";
import { ContextSwitcher } from "~/shell/topbar/ContextSwitcher";
import { ContextTabs } from "~/shell/topbar/ContextTabs";
import { EnginMark } from "~/shell/topbar/EnginMark";

/**
 * The signed-in bar. One row on desktop; on phone the tabs wrap onto a
 * second row (`order-last w-full`) under the switcher, search and bell.
 */
export function TopBar() {
	const context = useShellContext();
	const { togglePalette } = useCommands();

	return (
		<header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
			<div className="flex flex-wrap items-center gap-x-1 px-4 md:gap-x-3 md:px-6">
				<EnginMark className="hidden h-14 md:flex" />
				<div className="flex h-[52px] min-w-0 flex-1 items-center md:h-14 md:flex-none">
					<ContextSwitcher context={context} />
				</div>
				<ContextTabs
					context={context}
					className="order-last w-full md:order-none md:w-auto"
				/>
				<div className="hidden flex-1 md:block" />
				<button
					type="button"
					aria-label="Search"
					onClick={togglePalette}
					className="flex size-9 shrink-0 items-center justify-center gap-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground md:h-8 md:w-auto md:px-2.5 md:ring-1 md:ring-border"
				>
					<Search className="size-4" />
					<span className="hidden md:inline">Search</span>
					<ShortcutHint id="palette.open" className="hidden md:inline" />
				</button>
				<BellLink />
				<AccountMenu />
			</div>
		</header>
	);
}
