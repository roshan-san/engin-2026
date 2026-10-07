import type { LucideIcon } from "lucide-react";
import {
	Activity,
	Compass,
	Inbox,
	ListChecks,
	MessagesSquare,
	Presentation,
	RefreshCw,
	Settings,
	Ticket,
	UserPlus,
	Users,
} from "lucide-react";

type PersonalNavItem = {
	readonly label: "Inbox" | "My Tasks" | "My Hackathons" | "Threads";
	readonly to: "/inbox" | "/my-tasks" | "/my-hackathons" | "/threads";
	readonly icon: LucideIcon;
};

type StartupNavItem = {
	readonly label:
		| "Cycles"
		| "Hiring"
		| "Team"
		| "Pitch"
		| "Activity"
		| "Settings";
	readonly to:
		| "/s/$slug/cycles"
		| "/s/$slug/hiring"
		| "/s/$slug/team"
		| "/s/$slug/pitch"
		| "/s/$slug/activity"
		| "/s/$slug/settings";
	readonly icon: LucideIcon;
};

/** Personal nav items, spanning every Startup — sidebar order per #19. */
export const PERSONAL_NAV: readonly PersonalNavItem[] = [
	{ label: "Inbox", to: "/inbox", icon: Inbox },
	{ label: "My Tasks", to: "/my-tasks", icon: ListChecks },
	{ label: "My Hackathons", to: "/my-hackathons", icon: Ticket },
	{ label: "Threads", to: "/threads", icon: MessagesSquare },
];

/** Focused-Startup nav items, rendered under the switcher. */
export const STARTUP_NAV: readonly StartupNavItem[] = [
	{ label: "Cycles", to: "/s/$slug/cycles", icon: RefreshCw },
	{ label: "Hiring", to: "/s/$slug/hiring", icon: UserPlus },
	{ label: "Team", to: "/s/$slug/team", icon: Users },
	{ label: "Pitch", to: "/s/$slug/pitch", icon: Presentation },
	{ label: "Activity", to: "/s/$slug/activity", icon: Activity },
	{ label: "Settings", to: "/s/$slug/settings", icon: Settings },
];

/** Final sidebar group — every Startup's contributors. */
export const DISCOVER_NAV: {
	label: "Discover";
	to: "/discover";
	icon: LucideIcon;
} = {
	label: "Discover",
	to: "/discover",
	icon: Compass,
};

/** Mobile top-bar screen titles (D-17), keyed by TanStack Router route id. */
export const SCREEN_TITLES: Partial<Record<string, string>> = {
	"/_shell/_authed/my-tasks/": "My Tasks",
	"/_shell/_authed/my-hackathons/": "My Hackathons",
	"/_shell/_authed/inbox/": "Inbox",
	"/_shell/_authed/threads/": "Threads",
	"/_shell/_authed/threads/$hackathonId": "Thread",
	"/_shell/_authed/profile/": "Edit profile",
	"/_shell/_authed/startups/new": "Create a Startup",
	"/_shell/_authed/s/$slug/_member/cycles/": "Cycles",
	"/_shell/_authed/s/$slug/_member/cycles/$cycleId": "Cycle",
	"/_shell/_authed/s/$slug/_member/hiring/": "Hiring",
	"/_shell/_authed/s/$slug/_member/hiring/new": "New Hackathon",
	"/_shell/_authed/s/$slug/_member/hiring/$hackathonId/edit": "Edit Hackathon",
	"/_shell/_authed/s/$slug/_member/team/": "Team",
	"/_shell/_authed/s/$slug/_member/pitch/": "Pitch",
	"/_shell/_authed/s/$slug/_member/activity/": "Activity",
	"/_shell/_authed/s/$slug/_member/settings/": "Settings",
	"/_shell/_authed/s/$slug/hackathons/$hackathonId": "Hackathon",
	"/_shell/discover/": "Discover",
	"/_shell/hackathons/$hackathonId": "Hackathon",
	"/_shell/pricing/": "Pricing",
	"/_shell/startup/$slug": "Pitch",
	"/_shell/u/$username": "Profile",
	"/_shell/invite/$token": "Invite",
};
