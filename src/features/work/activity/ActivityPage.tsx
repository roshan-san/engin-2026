import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { DetailPanel } from "~/components/DetailPanel";
import { PageBar } from "~/components/PageBar";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useDetailPanel } from "~/components/useDetailPanel";
import { useWorkspace } from "../board/StartupContext";
import { ActivityFeed } from "./ActivityFeed";
import { EntryPanel } from "./EntryPanel";
import { RecordPanel } from "./RecordPanel";
import { RecordSignals } from "./RecordSignals";
import { findEntry } from "./record";
import { useActivity } from "./useActivity";
import { useSignals } from "./useSignals";

const activityRoute = getRouteApi("/_shell/_authed/s/$slug/activity");

/** The team's Record: every Cycle, beside the Rating or an open entry's proof. */
export function ActivityPage() {
	const { startup } = useWorkspace();
	const signals = useSignals(startup.slug);
	const { data, showEarlier, isLoadingEarlier } = useActivity(startup._id);
	const { entry: entryId } = activityRoute.useSearch();
	const navigate = activityRoute.useNavigate();
	const open = data ? findEntry(data.cycles, entryId) : null;

	function select(id: string | undefined) {
		void navigate({ search: (prev) => ({ ...prev, entry: id }) });
	}

	const panel = useDetailPanel(open !== null, () => select(undefined));
	const isMobile = panel.isMobile;

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
				<PageBar
					title={<h1 className="text-sm font-medium">Activity</h1>}
					actions={
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="text-muted-foreground"
						>
							<Link to="/startups/$slug" params={{ slug: startup.slug }}>
								How others see this
								<ArrowUpRight aria-hidden />
							</Link>
						</Button>
					}
				/>
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
			<DetailPanel
				shows={panel.shows}
				title="What shipped"
				description="The Card's proof."
				onClose={panel.close}
				item={
					open ? (
						<EntryPanel
							key={open.entry.id}
							entry={open.entry}
							cycle={open.cycle}
							onBack={panel.back}
							onClose={isMobile ? panel.close : undefined}
						/>
					) : null
				}
				fallback={<RecordPanel signals={signals} />}
			/>
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
