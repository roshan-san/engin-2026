import { Link, useMatches } from "@tanstack/react-router";
import {
	Activity,
	Briefcase,
	Building2,
	Settings,
	SquareKanban,
	Trophy,
	Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { builderStatusText } from "~/features/hiring/builder/builderStatus";
import { useHackathon } from "~/features/hiring/public/useHackathon";
import { canSeeSettings, tabsFromRoute } from "~/shell/places";
import { usePlaces } from "~/shell/usePlaces";

export const TAB_CLASS =
	"relative flex shrink-0 items-center gap-1.5 px-2 py-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 aria-[current=page]:text-foreground aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-2 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-foreground [&_svg]:size-4 [&_svg]:shrink-0";

/** The second row: tabs that scroll sideways on a phone, and one thing pinned on the right. Its top rule is dropped right after a header that has its own bottom rule, so there is one line, not two. */
export function TabRowFrame({
	label,
	end,
	children,
}: {
	readonly label: string;
	readonly end?: ReactNode;
	readonly children: ReactNode;
}) {
	return (
		<nav
			aria-label={label}
			className="flex h-10 shrink-0 items-stretch border-t border-border bg-background px-2 md:px-4 [header+&]:border-t-0"
		>
			<div className="flex min-w-0 flex-1 items-stretch overflow-x-auto whitespace-nowrap">
				{children}
			</div>
			{end ? (
				<div className="flex shrink-0 items-center pl-2">{end}</div>
			) : null}
		</nav>
	);
}

/** The shell's second row, picked from the route. */
export function TabRow() {
	const tabs = useMatches({ select: tabsFromRoute });
	if (tabs?.kind === "startup") return <StartupRow slug={tabs.slug} />;
	if (tabs?.kind === "builder")
		return <BuilderTabs hackathonId={tabs.hackathonId} />;
	if (tabs?.kind === "explore") return <ExploreTabs />;
	return null;
}

function StartupRow({ slug }: { readonly slug: string }) {
	const places = usePlaces();

	return (
		<TabRowFrame
			label="Startup"
			end={
				canSeeSettings(places, slug) ? (
					<Link
						to="/s/$slug/settings"
						params={{ slug }}
						aria-label="Startup settings"
						className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 aria-[current=page]:bg-muted aria-[current=page]:text-foreground [&_svg]:size-4"
					>
						<Settings aria-hidden />
					</Link>
				) : null
			}
		>
			<Link to="/s/$slug/board" params={{ slug }} className={TAB_CLASS}>
				<SquareKanban aria-hidden />
				Board
			</Link>
			<Link to="/s/$slug/hiring" params={{ slug }} className={TAB_CLASS}>
				<Briefcase aria-hidden />
				Hiring
			</Link>
			<Link to="/s/$slug/activity" params={{ slug }} className={TAB_CLASS}>
				<Activity aria-hidden />
				Activity
			</Link>
			<Link to="/s/$slug/team" params={{ slug }} className={TAB_CLASS}>
				<Users aria-hidden />
				Team
			</Link>
		</TabRowFrame>
	);
}

function BuilderTabs({ hackathonId }: { readonly hackathonId: string }) {
	const page = useHackathon(hackathonId);
	const status = page
		? builderStatusText(page, page.myApplication?.decision ?? null, Date.now())
		: null;

	return (
		<TabRowFrame
			label="Hackathon"
			end={
				status ? (
					<span className="text-sm text-muted-foreground">{status}</span>
				) : null
			}
		>
			<Link
				to="/h/$id"
				params={{ id: hackathonId }}
				activeOptions={{ exact: true, includeSearch: false }}
				className={TAB_CLASS}
			>
				<SquareKanban aria-hidden />
				Board
			</Link>
		</TabRowFrame>
	);
}

function ExploreTabs() {
	return (
		<TabRowFrame label="Explore">
			<Link to="/explore/hackathons" className={TAB_CLASS}>
				<Trophy aria-hidden />
				Hackathons
			</Link>
			<Link to="/explore/startups" className={TAB_CLASS}>
				<Building2 aria-hidden />
				Startups
			</Link>
		</TabRowFrame>
	);
}
