// Pure: no imports, so it runs anywhere (including vitest's edge-runtime).

export type Tab = {
	readonly label: string;
	readonly href: string;
	readonly overflow?: boolean;
};

export type ShellContext =
	| { kind: "you"; tabs: Tab[]; activeTab?: Tab }
	| { kind: "startup"; slug: string; tabs: Tab[]; activeTab?: Tab }
	| { kind: "explore"; tabs: Tab[]; activeTab?: Tab }
	| { kind: "neutral" }
	| { kind: "loading" };

export type SwitchTarget = "you" | "explore" | { slug: string };

type TabDefinition = {
	label: string;
	path: string;
	also?: readonly string[];
	overflow?: boolean;
};

const YOU_TABS: readonly TabDefinition[] = [
	{ label: "My Hackathons", path: "/my-hackathons" },
];

// Pages that belong to You but have no tab of their own.
const YOU_EXTRA_PREFIXES = ["/profile", "/startups/new"] as const;

const STARTUP_TABS: readonly TabDefinition[] = [
	{ label: "Cycles", path: "/s/$slug/cycles" },
	{ label: "Hiring", path: "/s/$slug/hiring", also: ["/s/$slug/hackathons"] },
	{ label: "Team", path: "/s/$slug/team" },
	{ label: "Pitch", path: "/s/$slug/pitch" },
	{ label: "Activity", path: "/s/$slug/activity" },
	{ label: "Settings", path: "/s/$slug/settings", overflow: true },
];

const EXPLORE_TABS: readonly TabDefinition[] = [
	{ label: "Startups", path: "/explore/startups" },
	{ label: "Hackathons", path: "/explore/hackathons" },
	{ label: "People", path: "/explore/people" },
];

const EXPLORE_ROOT = "/explore";
const STARTUP_PATH = /^\/s\/([^/]+)(?:\/|$)/;

function stripTrailingSlash(pathname: string): string {
	return pathname.length > 1 && pathname.endsWith("/")
		? pathname.slice(0, -1)
		: pathname;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
	return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function resolveTabs(
	definitions: readonly TabDefinition[],
	slug?: string,
): { definition: TabDefinition; tab: Tab; prefixes: string[] }[] {
	const fill = (path: string) => (slug ? path.replace("$slug", slug) : path);
	return definitions.map((definition) => {
		const href = fill(definition.path);
		const tab: Tab = definition.overflow
			? { label: definition.label, href, overflow: true }
			: { label: definition.label, href };
		return {
			definition,
			tab,
			prefixes: [href, ...(definition.also ?? []).map(fill)],
		};
	});
}

/** The tab whose longest matching prefix covers the path, if any. */
function findActiveTab(
	pathname: string,
	resolved: ReturnType<typeof resolveTabs>,
): Tab | undefined {
	let best: { tab: Tab; length: number } | undefined;
	for (const { tab, prefixes } of resolved) {
		for (const prefix of prefixes) {
			if (
				matchesPrefix(pathname, prefix) &&
				(!best || prefix.length > best.length)
			) {
				best = { tab, length: prefix.length };
			}
		}
	}
	return best?.tab;
}

function withActiveTab<T extends { tabs: Tab[]; activeTab?: Tab }>(
	context: T,
	activeTab: Tab | undefined,
): T {
	return activeTab ? { ...context, activeTab } : context;
}

export function buildShellContext(input: {
	pathname: string;
	memberships: readonly { slug: string }[] | undefined;
}): ShellContext {
	const pathname = stripTrailingSlash(input.pathname);

	const startupSlug = STARTUP_PATH.exec(pathname)?.[1];
	if (startupSlug) {
		if (input.memberships === undefined) return { kind: "loading" };
		if (!input.memberships.some((m) => m.slug === startupSlug)) {
			return { kind: "neutral" };
		}
		const resolved = resolveTabs(STARTUP_TABS, startupSlug);
		return withActiveTab(
			{
				kind: "startup" as const,
				slug: startupSlug,
				tabs: resolved.map((r) => r.tab),
			},
			findActiveTab(pathname, resolved),
		);
	}

	if (matchesPrefix(pathname, EXPLORE_ROOT)) {
		const resolved = resolveTabs(EXPLORE_TABS);
		return withActiveTab(
			{ kind: "explore" as const, tabs: resolved.map((r) => r.tab) },
			findActiveTab(pathname, resolved),
		);
	}

	const resolvedYou = resolveTabs(YOU_TABS);
	const youActive = findActiveTab(pathname, resolvedYou);
	if (
		youActive ||
		YOU_EXTRA_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
	) {
		return withActiveTab(
			{ kind: "you" as const, tabs: resolvedYou.map((r) => r.tab) },
			youActive,
		);
	}

	return { kind: "neutral" };
}

export function buildSwitchTarget(input: {
	pathname: string;
	target: SwitchTarget;
}): string {
	const { target } = input;
	if (target === "you") return "/my-tasks";
	if (target === "explore") return "/explore/startups";

	const pathname = stripTrailingSlash(input.pathname);
	const currentSlug = STARTUP_PATH.exec(pathname)?.[1];
	const fallback = `/s/${target.slug}/cycles`;
	if (!currentSlug) return fallback;

	const current = findActiveTab(
		pathname,
		resolveTabs(STARTUP_TABS, currentSlug),
	);
	if (!current) return fallback;

	const section = STARTUP_TABS.find(
		(d) => d.label === current.label,
	)?.path.replace("$slug", target.slug);
	return section ?? fallback;
}
