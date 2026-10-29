import { getRouteApi, Link } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { ActivityFeed, usePublicActivity } from "~/entities/activity";
import { usePlaces } from "~/entities/place";
import { RecordSignals, useSignals } from "~/entities/rating";
import {
	CITIES,
	hiringLine,
	KINDS,
	STAGES,
	usePublicStartup,
} from "~/entities/startup";
import { jobLine } from "~/shared/config/jobs";
import { cn } from "~/shared/lib/cn";
import { dayLabel, monthYearLabel } from "~/shared/lib/dates";
import { tierText } from "~/shared/lib/tierText";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import { GlobalNotFound } from "~/shared/ui/GlobalNotFound";
import { GlobalSpinner } from "~/shared/ui/GlobalSpinner";
import { Page } from "~/shared/ui/Page";
import { PlaceLogo } from "~/shared/ui/PlaceLogo";
import { Section } from "~/shared/ui/Section";
import { Skeleton } from "~/shared/ui/skeleton";
import { TILE, TILE_LINK } from "~/shared/ui/tile";

const route = getRouteApi("/_shell/startups/$slug");

function labelOf<T extends string>(
	chips: readonly { value: T; label: string }[],
	value: T,
): string {
	return chips.find((chip) => chip.value === value)?.label ?? value;
}

/** A Startup's public Record: who they are, their Rating, hiring and Cycles. */
export function PublicStartupPage() {
	const { slug } = route.useParams();
	const startup = usePublicStartup(slug);
	const signals = useSignals(slug);
	const { isAuthenticated } = useConvexAuth();
	const places = usePlaces(isAuthenticated);
	const {
		data: activity,
		showEarlier,
		isLoadingEarlier,
	} = usePublicActivity(slug);

	if (startup === undefined) {
		return <GlobalSpinner fill />;
	}
	if (startup === null) {
		return (
			<GlobalNotFound
				title={`No startup at /startups/${slug}`}
				action={
					<Button asChild>
						<Link to="/explore/startups">Explore startups</Link>
					</Button>
				}
			/>
		);
	}

	const hiring = hiringLine(startup.hiringRecord);
	const chips = [
		labelOf(STAGES, startup.stage),
		labelOf(KINDS, startup.category),
		labelOf(CITIES, startup.city),
	];

	const isOnTeam = places?.startups.some((s) => s.slug === slug) ?? false;

	return (
		<div className="flex flex-col">
			<section className="border-b border-border bg-[radial-gradient(circle_at_top_right,var(--glow),transparent_60%)]">
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 md:px-6 md:py-14">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
						<div className="flex min-w-0 flex-1 items-start gap-4">
							<PlaceLogo name={startup.name} url={startup.logo} size={64} />
							<div className="flex min-w-0 flex-1 flex-col gap-2">
								<h1 className="text-3xl font-semibold break-words">
									{startup.name}
								</h1>
								{startup.oneLiner ? (
									<p className="text-lg text-muted-foreground">
										{startup.oneLiner}
									</p>
								) : null}
								<div className="flex flex-wrap items-center gap-2">
									{chips.map((chip) => (
										<Badge key={chip} variant="secondary">
											{chip}
										</Badge>
									))}
								</div>
							</div>
						</div>
						<div className="flex shrink-0 flex-col items-start sm:items-end">
							<span
								className={cn(
									"text-3xl font-semibold tabular-nums",
									tierText(startup.rating),
								)}
							>
								{startup.rating}
							</span>
							<span className="text-xs text-muted-foreground">Rating</span>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
						{startup.website ? (
							<a
								href={startup.website}
								target="_blank"
								rel="noreferrer noopener"
								className="text-link underline-offset-4 hover:underline"
							>
								{startup.website.replace(/^https?:\/\//, "")}
							</a>
						) : null}
						<span>On engin since {monthYearLabel(startup.createdAt)}</span>
						{isOnTeam ? (
							<Button asChild size="sm" className="ml-auto">
								<Link to="/s/$slug/board" params={{ slug }}>
									Open Board
								</Link>
							</Button>
						) : null}
					</div>
				</div>
			</section>
			<Page width="narrow" className="flex flex-col gap-10">
				{signals ? (
					<RecordSignals signals={signals} />
				) : (
					<Skeleton className="h-24 w-64" />
				)}

				{startup.openHackathons.length > 0 ? (
					<Section label="Hiring now">
						<div className="grid gap-3 sm:grid-cols-2">
							{startup.openHackathons.map((h) => (
								<Link
									key={h.hackathonId}
									to="/hackathons/$id"
									params={{ id: h.hackathonId }}
									className={cn(TILE_LINK, "flex flex-col gap-1")}
								>
									<span className="font-medium">{jobLine(h.job)}</span>
									<span className="text-sm text-muted-foreground">
										{h.weeks} {h.weeks === 1 ? "week" : "weeks"} · starts{" "}
										{dayLabel(h.startsAt)}
									</span>
									{h.participantsGet ? (
										<span className="text-sm">
											Participants get {h.participantsGet}
										</span>
									) : null}
								</Link>
							))}
						</div>
					</Section>
				) : null}

				{hiring ? (
					<Section label="Hiring record">
						<p className="text-sm">{hiring}</p>
					</Section>
				) : null}

				<Section
					label="Cycles"
					aside={activity?.full ? "Investor Pro view" : null}
				>
					{activity ? (
						<ActivityFeed
							cycles={activity.cycles}
							hasMore={activity.hasMore}
							onShowEarlier={showEarlier}
							isLoadingEarlier={isLoadingEarlier}
							mode={activity.full ? "full" : "masked"}
						/>
					) : (
						<Skeleton className="h-40 w-full" />
					)}
				</Section>

				{!isAuthenticated ? (
					<section className={cn(TILE, "flex flex-col items-start gap-3 p-6")}>
						<p className="font-medium">
							Want to build with startups like {startup.name}?
						</p>
						<Button asChild variant="outline">
							<Link to="/explore/hackathons">Find a hackathon</Link>
						</Button>
					</section>
				) : null}
			</Page>
		</div>
	);
}
