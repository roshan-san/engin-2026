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
	readonly label: "Inbox" | "My Pulses" | "My Entries" | "Threads";
	readonly to: "/inbox" | "/my-pulses" | "/my-entries" | "/threads";
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
	{ label: "My Pulses", to: "/my-pulses", icon: ListChecks },
	{ label: "My Entries", to: "/my-entries", icon: Ticket },
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
	"/_shell/_authed/my-pulses/": "My Pulses",
	"/_shell/_authed/my-entries/": "My Entries",
	"/_shell/_authed/inbox/": "Inbox",
	"/_shell/_authed/threads/": "Threads",
	"/_shell/_authed/threads/$trialCycleId": "Thread",
	"/_shell/_authed/profile/": "Edit profile",
	"/_shell/_authed/startups/new": "Create Startup",
	"/_shell/_authed/s/$slug/_member/cycles/": "Cycles",
	"/_shell/_authed/s/$slug/_member/cycles/$cycleId": "Cycle",
	"/_shell/_authed/s/$slug/_member/hiring/": "Hiring",
	"/_shell/_authed/s/$slug/_member/hiring/new": "New hackathon",
	"/_shell/_authed/s/$slug/_member/hiring/$trialCycleId/edit": "Edit hackathon",
	"/_shell/_authed/s/$slug/_member/team/": "Team",
	"/_shell/_authed/s/$slug/_member/pitch/": "Pitch",
	"/_shell/_authed/s/$slug/_member/activity/": "Activity",
	"/_shell/_authed/s/$slug/_member/settings/": "Settings",
	"/_shell/_authed/s/$slug/trials/$trialCycleId": "Trial Cycle",
	"/_shell/discover/": "Discover",
	"/_shell/hackathons/$trialCycleId": "Hackathon",
	"/_shell/pricing/": "Pricing",
	"/_shell/startup/$slug": "Pitch",
	"/_shell/u/$username": "Profile",
	"/_shell/invite/$token": "Invite",
};
