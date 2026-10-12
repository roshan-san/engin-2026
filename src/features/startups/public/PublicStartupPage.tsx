import { getRouteApi } from "@tanstack/react-router";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { Page } from "~/components/Page";
import { SectionLabel } from "~/components/SectionLabel";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { ActivityFeed } from "~/features/work/activity/ActivityFeed";
import { useSignals } from "~/features/work/activity/hooks/useSignals";
import { RecordSignals } from "~/features/work/activity/RecordSignals";
import { initials } from "~/lib/initials";
import { CITIES, KINDS, STAGES } from "../startupChips";
import { hiringLine } from "./hiringLine";
import { usePublicActivity } from "./hooks/usePublicActivity";
import { usePublicStartup } from "./hooks/usePublicStartup";

const route = getRouteApi("/_shell/startups/$slug");

const SINCE = new Intl.DateTimeFormat("en-US", {
	timeZone: "Asia/Kolkata",
	month: "short",
	year: "numeric",
});

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
	const {
		data: activity,
		showEarlier,
		isLoadingEarlier,
	} = usePublicActivity(slug);

	if (startup === undefined) {
		return <GlobalSpinner fill />;
	}
	if (startup === null) {
		return <GlobalNotFound />;
	}

	const hiring = hiringLine(startup.hiringRecord);
	const chips = [
		labelOf(STAGES, startup.stage),
		labelOf(KINDS, startup.category),
		labelOf(CITIES, startup.city),
	];

	return (
		<Page width="narrow" className="flex flex-col gap-10">
			<header className="flex items-start gap-4">
				<Avatar className="size-14 rounded-xl">
					{startup.logo ? <AvatarImage src={startup.logo} alt="" /> : null}
					<AvatarFallback className="rounded-xl">
						{initials(startup.name, null)}
					</AvatarFallback>
				</Avatar>
				<div className="flex min-w-0 flex-col gap-2">
					<h1 className="text-2xl font-semibold tracking-tight break-words">
						{startup.name}
					</h1>
					{startup.oneLiner ? (
						<p className="text-sm text-muted-foreground">{startup.oneLiner}</p>
					) : null}
					<div className="flex flex-wrap items-center gap-2">
						{chips.map((chip) => (
							<Badge key={chip} variant="secondary">
								{chip}
							</Badge>
						))}
					</div>
					<p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
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
						<span>On Engin since {SINCE.format(startup.createdAt)}</span>
					</p>
				</div>
			</header>

			{signals ? (
				<RecordSignals signals={signals} />
			) : (
				<Skeleton className="h-24 w-64" />
			)}

			{hiring ? (
				<section className="flex flex-col gap-3">
					<SectionLabel>Hiring</SectionLabel>
					<p className="text-sm">{hiring}</p>
				</section>
			) : null}

			<section className="flex flex-col gap-4">
				<div className="flex items-baseline gap-3 border-b border-border pb-2">
					<h2 className="text-xs font-semibold text-muted-foreground">
						Cycles
					</h2>
					{activity?.full ? (
						<span className="text-xs text-muted-foreground">
							Investor Pro view
						</span>
					) : null}
				</div>
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
			</section>
		</Page>
	);
}
