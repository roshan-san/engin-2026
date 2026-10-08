import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";
import { AccountMenu } from "~/shell/account/AccountMenu";
import { useCommands } from "~/shell/command/CommandProvider";
import { useCurrentCrumb } from "~/shell/crumbs/CrumbProvider";
import { useShellContext } from "~/shell/hooks/useShellContext";
import { BellLink } from "~/shell/topbar/BellLink";
import { ContextSwitcher } from "~/shell/topbar/ContextSwitcher";
import { ContextTabs } from "~/shell/topbar/ContextTabs";
import { EnginLogo } from "~/shell/topbar/EnginLogo";
import { SearchField } from "~/shell/topbar/SearchField";
import { useStuck } from "~/shell/topbar/useStuck";

function Slash() {
	return (
		<span aria-hidden className="shrink-0 select-none text-lg text-input">
			/
		</span>
	);
}

/**
 * The signed-in bar, in two rows. Row 1 (logo, switcher, deep-page crumb,
 * search, inbox, account) scrolls away; row 2 (tabs) sticks, and the logo
 * slides into it once it's stuck.
 */
export function TopBar() {
	const context = useShellContext();
	const { togglePalette } = useCommands();
	const crumb = useCurrentCrumb();
	const { sentinelRef, stuck } = useStuck();
	const hasTabs = context.kind !== "neutral";

	return (
		<>
			<header className="border-border bg-background">
				<div className="flex h-14 items-center gap-1.5 px-4 md:gap-2 md:px-6">
					<nav
						aria-label="Breadcrumb"
						className="flex min-w-0 flex-1 items-center gap-1.5 md:gap-2"
					>
						<EnginLogo />
						<Slash />
						<div className="min-w-0 max-w-[45vw] md:max-w-60">
							<ContextSwitcher context={context} />
						</div>
						{crumb ? (
							<>
								<Slash />
								<Link
									to={crumb.href}
									className="min-w-0 max-w-[30vw] truncate rounded-md px-1.5 py-1 text-sm font-medium hover:bg-accent md:max-w-60"
								>
									{crumb.label}
								</Link>
							</>
						) : null}
					</nav>
					<SearchField onOpen={togglePalette} />
					<BellLink />
					<AccountMenu />
				</div>
			</header>
			<div ref={sentinelRef} aria-hidden />
			<div
				data-stuck={stuck || undefined}
				className={cn(
					"sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur",
					!hasTabs && "h-px border-b-0",
				)}
			>
				{hasTabs ? (
					<div className="flex h-12 items-stretch px-4 md:px-6">
						<div
							className={cn(
								"flex shrink-0 items-center overflow-hidden transition-all duration-200",
								stuck
									? "w-10 translate-x-0 opacity-100"
									: "pointer-events-none w-0 -translate-x-2 opacity-0",
							)}
							aria-hidden={!stuck}
						>
							<EnginLogo className="size-7" tabIndex={stuck ? undefined : -1} />
						</div>
						<ContextTabs context={context} className="min-w-0 flex-1" />
					</div>
				) : null}
			</div>
		</>
	);
}
