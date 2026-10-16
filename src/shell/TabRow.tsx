import { Link, useMatches } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { participantStatusText } from "~/features/hiring/participant/participantStatus";
import { useHackathon } from "~/features/hiring/public/useHackathon";
import { StartupSettingsSheet } from "~/features/startups/settings/StartupSettingsSheet";
import {
	canSeeSettings,
	tabsForSignedOut,
	tabsFromRoute,
} from "~/shell/places";
import { usePlaces } from "~/shell/usePlaces";

const TAB_CLASS =
	"relative flex shrink-0 items-center px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground focus-ring aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-2 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-foreground";

/** The second row: tabs that scroll sideways on a phone, and one thing pinned on the right. Its top rule is dropped right after a header that has its own bottom rule, so there is one line, not two. */
function TabRowFrame({
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

/** The shell's second row, picked from the route. Signed out, only Explore's row shows. */
export function TabRow({
	signedOut = false,
}: {
	readonly signedOut?: boolean;
}) {
	const routeTabs = useMatches({ select: tabsFromRoute });
	const tabs = signedOut ? tabsForSignedOut(routeTabs) : routeTabs;
	if (tabs?.kind === "startup") return <StartupRow slug={tabs.slug} />;
	if (tabs?.kind === "participant")
		return <ParticipantTabs hackathonId={tabs.hackathonId} />;
	if (tabs?.kind === "explore") return <ExploreTabs />;
	return null;
}

function StartupRow({ slug }: { readonly slug: string }) {
	const places = usePlaces();
	const [settingsOpen, setSettingsOpen] = useState(false);

	return (
		<TabRowFrame
			label="Startup"
			end={
				canSeeSettings(places, slug) ? (
					<>
						<button
							type="button"
							className="flex h-8 items-center rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-ring"
							onClick={() => setSettingsOpen(true)}
						>
							Settings
						</button>
						<StartupSettingsSheet
							slug={slug}
							open={settingsOpen}
							onOpenChange={setSettingsOpen}
						/>
					</>
				) : null
			}
		>
			<Link to="/s/$slug/board" params={{ slug }} className={TAB_CLASS}>
				Board
			</Link>
			<Link to="/s/$slug/hiring" params={{ slug }} className={TAB_CLASS}>
				Hiring
			</Link>
			<Link to="/s/$slug/activity" params={{ slug }} className={TAB_CLASS}>
				Activity
			</Link>
			<Link to="/s/$slug/team" params={{ slug }} className={TAB_CLASS}>
				Team
			</Link>
		</TabRowFrame>
	);
}

function ParticipantTabs({ hackathonId }: { readonly hackathonId: string }) {
	const page = useHackathon(hackathonId);
	const status = page
		? participantStatusText(
				page,
				page.myApplication?.decision ?? null,
				Date.now(),
			)
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
				Board
			</Link>
			<Link
				to="/h/$id/brief"
				params={{ id: hackathonId }}
				className={TAB_CLASS}
			>
				Brief
			</Link>
		</TabRowFrame>
	);
}

function ExploreTabs() {
	return (
		<TabRowFrame label="Explore">
			<Link to="/explore/hackathons" className={TAB_CLASS}>
				Hackathons
			</Link>
			<Link to="/explore/startups" className={TAB_CLASS}>
				Startups
			</Link>
		</TabRowFrame>
	);
}
