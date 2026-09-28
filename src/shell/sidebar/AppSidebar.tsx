import { Link, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { AccountMenu } from "~/shell/account/AccountMenu";
import { useCommands } from "~/shell/command/CommandProvider";
import { useFocusedStartup } from "~/shell/hooks/useFocusedStartup";
import { useNotifications } from "~/shell/hooks/useNotifications";
import { DISCOVER_NAV, PERSONAL_NAV, STARTUP_NAV } from "~/shell/nav";
import { StartupSwitcher } from "~/shell/sidebar/StartupSwitcher";
import { ShortcutHint } from "~/shell/shortcuts/ShortcutHint";

/**
 * Desktop sidebar (D-07, UI E2): personal items, the Startup switcher plus
 * the Focused-Startup section, then Discover. The active item gets a
 * `bg-sidebar-accent` fill, white text (from the primitive) and a blue icon.
 */
export function AppSidebar() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const { focused } = useFocusedStartup();
	const { count, isLoading: notificationsLoading } = useNotifications();
	const { togglePalette } = useCommands();
	const DiscoverIcon = DISCOVER_NAV.icon;

	return (
		<Sidebar
			collapsible="none"
			className="sticky top-0 h-dvh border-r border-sidebar-border"
		>
			<SidebarHeader>
				<Link
					to="/my-pulses"
					className="flex h-8 items-center px-2 text-sm font-semibold text-sidebar-foreground"
				>
					Engin
				</Link>
				<Tooltip>
					<TooltipTrigger asChild>
						<SidebarMenuButton onClick={togglePalette}>
							<Search className="text-muted-foreground" />
							<span>Search</span>
							<ShortcutHint id="palette.open" className="ml-auto" />
						</SidebarMenuButton>
					</TooltipTrigger>
					<TooltipContent side="right" className="flex items-center gap-2">
						Open command palette
						<ShortcutHint id="palette.open" />
					</TooltipContent>
				</Tooltip>
			</SidebarHeader>
			<SidebarContent className="overflow-y-auto">
				<SidebarGroup>
					<SidebarMenu>
						{PERSONAL_NAV.map(({ label, to, icon: Icon }) => {
							const active = pathname.startsWith(to);
							const showBadge =
								label === "Inbox" && !notificationsLoading && count > 0;
							return (
								<SidebarMenuItem key={to}>
									<SidebarMenuButton asChild isActive={active}>
										<Link to={to}>
											<Icon
												className={
													active ? "text-primary" : "text-muted-foreground"
												}
											/>
											<span>{label}</span>
										</Link>
									</SidebarMenuButton>
									{showBadge ? (
										<SidebarMenuBadge className="bg-primary text-primary-foreground rounded-md tabular-nums">
											{count}
										</SidebarMenuBadge>
									) : null}
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>

				<SidebarGroup>
					<StartupSwitcher />
					{focused ? (
						<SidebarMenu className="mt-1">
							{STARTUP_NAV.map(({ label, to, icon: Icon }) => {
								const path = to.replace("$slug", focused.startup.slug);
								const active = pathname.startsWith(path);
								return (
									<SidebarMenuItem key={to}>
										<SidebarMenuButton asChild isActive={active}>
											<Link to={to} params={{ slug: focused.startup.slug }}>
												<Icon
													className={
														active ? "text-primary" : "text-muted-foreground"
													}
												/>
												<span>{label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					) : null}
				</SidebarGroup>

				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								isActive={pathname.startsWith(DISCOVER_NAV.to)}
							>
								<Link to={DISCOVER_NAV.to}>
									<DiscoverIcon
										className={
											pathname.startsWith(DISCOVER_NAV.to)
												? "text-primary"
												: "text-muted-foreground"
										}
									/>
									<span>{DISCOVER_NAV.label}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<AccountMenu />
			</SidebarFooter>
		</Sidebar>
	);
}
