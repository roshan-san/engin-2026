import type { useNavigate } from "@tanstack/react-router";

export type ShortcutScope = "global" | "navigation" | "startup";

export type ShortcutContext = {
	navigate: ReturnType<typeof useNavigate>;
	focusedSlug: string | null;
	togglePalette: () => void;
	openShortcutSheet: () => void;
	focusSearch: () => void;
};

export type ShortcutEntry = {
	id: string;
	key: string | null;
	label: string;
	scope: ShortcutScope;
	action: (ctx: ShortcutContext) => void;
};

function goToStartup(
	to:
		| "/s/$slug/cycles"
		| "/s/$slug/hiring"
		| "/s/$slug/team"
		| "/s/$slug/pitch"
		| "/s/$slug/activity"
		| "/s/$slug/settings",
) {
	return (ctx: ShortcutContext) => {
		if (ctx.focusedSlug) {
			ctx.navigate({ to, params: { slug: ctx.focusedSlug } });
		}
	};
}

/**
 * The single shortcut registry (SHELL-05). This is the only place a shortcut
 * is defined — the ⌘K palette, the `?` sheet, and every tooltip/menu hint all
 * read from SHORTCUTS. Later phases append their own entries here (D-19)
 * rather than defining shortcuts elsewhere. There are no two-key chords in
 * this registry — out of scope this milestone.
 */
export const SHORTCUTS: readonly ShortcutEntry[] = [
	{
		id: "palette.open",
		key: "mod+k",
		label: "Open command palette",
		scope: "global",
		action: (ctx) => ctx.togglePalette(),
	},
	{
		id: "search.focus",
		key: "/",
		label: "Search",
		scope: "global",
		action: (ctx) => ctx.focusSearch(),
	},
	{
		id: "shortcuts.open",
		key: "?",
		label: "Show keyboard shortcuts",
		scope: "global",
		action: (ctx) => ctx.openShortcutSheet(),
	},
	{
		id: "nav.inbox",
		key: null,
		label: "Go to Inbox",
		scope: "navigation",
		action: (ctx) => ctx.navigate({ to: "/inbox" }),
	},
	{
		id: "nav.my-tasks",
		key: null,
		label: "Go to My Tasks",
		scope: "navigation",
		action: (ctx) => ctx.navigate({ to: "/my-tasks" }),
	},
	{
		id: "nav.threads",
		key: null,
		label: "Go to Threads",
		scope: "navigation",
		action: (ctx) => ctx.navigate({ to: "/threads" }),
	},
	{
		id: "nav.discover",
		key: null,
		label: "Go to Discover",
		scope: "navigation",
		action: (ctx) => ctx.navigate({ to: "/discover" }),
	},
	{
		id: "nav.create-startup",
		key: null,
		label: "Create a Startup",
		scope: "navigation",
		action: (ctx) => ctx.navigate({ to: "/startups/new" }),
	},
	{
		id: "startup.cycles",
		key: null,
		label: "Go to Cycles",
		scope: "startup",
		action: goToStartup("/s/$slug/cycles"),
	},
	{
		id: "startup.hiring",
		key: null,
		label: "Go to Hiring",
		scope: "startup",
		action: goToStartup("/s/$slug/hiring"),
	},
	{
		id: "startup.team",
		key: null,
		label: "Go to Team",
		scope: "startup",
		action: goToStartup("/s/$slug/team"),
	},
	{
		id: "startup.pitch",
		key: null,
		label: "Go to Pitch",
		scope: "startup",
		action: goToStartup("/s/$slug/pitch"),
	},
	{
		id: "startup.activity",
		key: null,
		label: "Go to Activity",
		scope: "startup",
		action: goToStartup("/s/$slug/activity"),
	},
	{
		id: "startup.settings",
		key: null,
		label: "Go to Settings",
		scope: "startup",
		action: goToStartup("/s/$slug/settings"),
	},
];

export function findShortcut(id: string): ShortcutEntry | undefined {
	return SHORTCUTS.find((entry) => entry.id === id);
}
