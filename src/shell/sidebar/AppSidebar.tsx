import { Link, useRouterState } from "@tanstack/react-router";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";
import { DISCOVER_NAV, PERSONAL_NAV, STARTUP_NAV } from "~/shell/nav";
import { useFocusedStartup } from "~/shell/hooks/useFocusedStartup";
import { StartupSwitcher } from "~/shell/sidebar/StartupSwitcher";

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
			</SidebarHeader>
			<SidebarContent className="overflow-y-auto">
				<SidebarGroup>
					<SidebarMenu>
						{PERSONAL_NAV.map(({ label, to, icon: Icon }) => {
							const active = pathname.startsWith(to);
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
		</Sidebar>
	);
}
