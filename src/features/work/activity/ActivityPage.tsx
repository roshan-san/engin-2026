import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { PanelHeader } from "~/components/shared/PanelHeader";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { useIsMobile } from "~/hooks/use-mobile";
import { useWorkspace } from "../board/StartupContext";
import { ActivityFeed } from "./ActivityFeed";
import { EntryPanel } from "./EntryPanel";
import { useActivity } from "./hooks/useActivity";
import { useSignals } from "./hooks/useSignals";
import { RecordPanel } from "./RecordPanel";
import { RecordSignals } from "./RecordSignals";
import { findEntry } from "./record";

const activityRoute = getRouteApi("/_shell/_authed/s/$slug/activity");

/** The team's Record: every Cycle, beside the Rating or an open entry's proof. */
export function ActivityPage() {
	const { startup } = useWorkspace();
	const signals = useSignals(startup.slug);
	const { data, showEarlier, isLoadingEarlier } = useActivity(startup._id);
	const { entry: entryId } = activityRoute.useSearch();
	const navigate = activityRoute.useNavigate();
	const isMobile = useIsMobile();
	const open = data ? findEntry(data.cycles, entryId) : null;

	function select(id: string | undefined) {
		void navigate({ search: (prev) => ({ ...prev, entry: id }) });
	}

	// Escape closes the open entry; on a phone the sheet handles it.
	useEffect(() => {
		if (!entryId || isMobile !== false) return;
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				void navigate({ search: (prev) => ({ ...prev, entry: undefined }) });
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [entryId, isMobile, navigate]);

	return (
		<div className="flex h-full min-h-0">
			<div className="flex min-h-0 min-w-0 flex-1 flex-col">
				<PanelHeader className="gap-3 md:px-6">
					<h1 className="text-sm font-medium">Activity</h1>
					<span className="hidden truncate text-sm text-muted-foreground sm:inline">
						Every verified Card, week by week
					</span>
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="ml-auto shrink-0 text-muted-foreground"
					>
						<Link to="/startups/$slug" params={{ slug: startup.slug }}>
							How others see this
							<ArrowUpRight aria-hidden />
						</Link>
					</Button>
				</PanelHeader>
				<div className="min-h-0 flex-1 overflow-y-auto">
					<div className="flex flex-col gap-10 px-4 py-6 md:px-6">
						{/* On a phone there's no side panel, so the Record leads the feed. */}
						<div className="md:hidden">
							{signals ? <RecordSignals signals={signals} /> : null}
						</div>
						<section className="flex flex-col gap-4">
							<h2 className="sr-only">Cycles</h2>
							{data ? (
								<ActivityFeed
									cycles={data.cycles}
									hasMore={data.hasMore}
									onShowEarlier={showEarlier}
									isLoadingEarlier={isLoadingEarlier}
									mode="full"
									selectedId={open?.entry.id}
									onSelect={(id) => select(id === entryId ? undefined : id)}
									emptyHint={
										<>
											Cards land here when they're verified on the{" "}
											<Link
												to="/s/$slug/board"
												params={{ slug: startup.slug }}
												className="text-foreground underline underline-offset-4 hover:text-link"
											>
												Board
											</Link>
											.
										</>
									}
								/>
							) : (
								<FeedSkeleton />
							)}
						</section>
					</div>
				</div>
			</div>
			<aside className="hidden w-[380px] shrink-0 flex-col border-l border-border md:flex">
				{open && isMobile === false ? (
					<EntryPanel
						key={open.entry.id}
						entry={open.entry}
						cycle={open.cycle}
						onBack={() => select(undefined)}
					/>
				) : (
					<RecordPanel signals={signals} />
				)}
			</aside>
			<Sheet
				open={isMobile === true && open !== null}
				onOpenChange={(isOpen) => {
					if (!isOpen) select(undefined);
				}}
			>
				<SheetContent
					side="bottom"
					className="h-[85dvh] gap-0"
					showCloseButton={false}
				>
					<SheetHeader className="sr-only">
						<SheetTitle>What shipped</SheetTitle>
						<SheetDescription>The Card's proof.</SheetDescription>
					</SheetHeader>
					{open && isMobile === true ? (
						<EntryPanel
							entry={open.entry}
							cycle={open.cycle}
							onBack={() => select(undefined)}
							onClose={() => select(undefined)}
						/>
					) : null}
				</SheetContent>
			</Sheet>
		</div>
	);
}

function FeedSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			<Skeleton className="h-6 w-full" />
			{[0, 1, 2].map((row) => (
				<div key={row} className="flex items-center gap-3">
					<Skeleton className="size-6 rounded-full" />
					<Skeleton className="h-4 flex-1" />
				</div>
			))}
		</div>
	);
}
