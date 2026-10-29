import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import {
	ActivityFeed,
	EntryPanel,
	findEntry,
	useActivity,
} from "~/entities/activity";
import { useWorkspace } from "~/entities/startup";
import { cn } from "~/shared/lib/cn";
import { tierText } from "~/shared/lib/tierText";
import { AppPage, PageTitle } from "~/shared/ui/AppPage";
import { Button } from "~/shared/ui/button";
import { DetailPanel } from "~/shared/ui/DetailPanel";
import { Skeleton } from "~/shared/ui/skeleton";
import { useDetailPanel } from "~/shared/ui/useDetailPanel";
import { RecordPanel } from "./RecordPanel";
import { RecordSignals } from "./RecordSignals";
import { useSignals } from "./useSignals";

const activityRoute = getRouteApi("/_shell/_authed/s/$slug/activity");

/** The team's Record: every Cycle, beside the Rating or an open entry's What shipped. */
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

	// A link to a Card outside the loaded Cycles clears itself and says why.
	// Only once loading is done, so a slow load never clears a good link.
	const loaded = data !== undefined && !isLoadingEarlier;
	const hasEarlier = data?.hasMore === true;
	useEffect(() => {
		if (!loaded || !entryId || open) return;
		void navigate({
			search: (prev) => ({ ...prev, entry: undefined }),
			replace: true,
		});
		// Show earlier is only a hint when there are earlier Cycles to show.
		toast(
			hasEarlier
				? "That Card is in an earlier Cycle. Show earlier to find it."
				: "That Card isn't in Activity.",
			{ id: "stale-entry" },
		);
	}, [loaded, hasEarlier, entryId, open, navigate]);

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
		<AppPage
			bar={{
				title: (
					<PageTitle
						name="Activity"
						context={
							signals ? (
								<>
									<span
										className={cn(
											"font-medium tabular-nums",
											tierText(signals.rating),
										)}
									>
										Rating {signals.rating}
									</span>
									<span className="tabular-nums">
										{" · "}
										{signals.verifiedTotal12} verified in 12 weeks
									</span>
								</>
							) : null
						}
					/>
				),
				actions: (
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
				),
			}}
			panel={
				<DetailPanel
					shows={panel.shows}
					title="What shipped"
					description="What the Card shipped."
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
			}
		>
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
		</AppPage>
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
