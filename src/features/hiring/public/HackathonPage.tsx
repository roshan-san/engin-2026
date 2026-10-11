import { useConvexAuth } from "@convex-dev/auth/react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { GlobalNotFound } from "~/components/globals/GlobalNotFound";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { Page } from "~/components/shared/Page";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { GoogleButton } from "~/features/people/auth/components/GoogleButton";
import { hiringLine } from "~/features/startups/public/hiringLine";
import { RatingBadge } from "~/features/work/activity/RatingBadge";
import { initials } from "~/lib/initials";
import { dayLabel } from "../hackathonDates";
import { jobLine } from "../jobChips";
import { ApplyForm } from "./ApplyForm";
import { APPLY_COPY, applyState, closedLabel } from "./applyStatus";
import { useHackathon } from "./hooks/useHackathon";

const route = getRouteApi("/_shell/hackathons/$id");

type HackathonView = NonNullable<ReturnType<typeof useHackathon>>;

/** A Hackathon as anyone sees it: the job, the problem, the Startup's record, and Apply. */
export function HackathonPage() {
	const { id } = route.useParams();
	const page = useHackathon(id);

	if (page === undefined) {
		return <GlobalSpinner />;
	}
	if (page === null) {
		return <GlobalNotFound />;
	}

	const hiring = hiringLine(page.hiringRecord);
	const weeks = page.weeks === 1 ? "1 week" : "2 weeks";

	return (
		<Page className="max-w-5xl">
			<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
				<article className="flex min-w-0 flex-col gap-8">
					<header className="flex flex-col gap-5">
						<h1 className="text-2xl font-semibold tracking-tight">
							{jobLine(page.job)}
						</h1>
						<Link
							to="/startups/$slug"
							params={{ slug: page.startup.slug }}
							className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
						>
							<Avatar className="size-10 rounded-lg">
								{page.startup.logo ? (
									<AvatarImage src={page.startup.logo} alt="" />
								) : null}
								<AvatarFallback className="rounded-lg">
									{initials(page.startup.name, null)}
								</AvatarFallback>
							</Avatar>
							<div className="flex min-w-0 flex-col">
								<span className="truncate text-sm font-medium">
									{page.startup.name}
								</span>
								{page.startup.oneLiner ? (
									<span className="truncate text-xs text-muted-foreground">
										{page.startup.oneLiner}
									</span>
								) : null}
							</div>
							<div className="ml-auto shrink-0">
								<RatingBadge
									rating={page.startup.rating}
									ratingChange={page.startup.ratingChange}
									isProvisional={page.startup.isProvisional}
								/>
							</div>
						</Link>
					</header>

					<section className="flex flex-col gap-3">
						<SectionLabel>The problem</SectionLabel>
						<p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
							{page.problem}
						</p>
					</section>

					<dl className="grid grid-cols-[9rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
						<dt className="text-muted-foreground">When</dt>
						<dd>
							{weeks} · starts {dayLabel(page.startsAt)}
						</dd>
						{page.buildersGet ? (
							<>
								<dt className="text-muted-foreground">What Builders get</dt>
								<dd>{page.buildersGet}</dd>
							</>
						) : null}
						{hiring ? (
							<>
								<dt className="text-muted-foreground">Hiring record</dt>
								<dd>{hiring}</dd>
							</>
						) : null}
						<dt className="text-muted-foreground">Applied</dt>
						<dd>{page.applicantCount}</dd>
					</dl>
				</article>

				<aside className="lg:sticky lg:top-6 lg:self-start">
					<div className="flex flex-col gap-3 rounded-xl border border-border p-4">
						<ApplyCard page={page} />
					</div>
				</aside>
			</div>
		</Page>
	);
}

function ApplyCard({ page }: { readonly page: HackathonView }) {
	const { isAuthenticated } = useConvexAuth();
	const state = applyState(page, isAuthenticated);

	switch (state) {
		case "sign_in":
			return (
				<>
					<p className="text-sm text-muted-foreground">
						Build for a week. Get hired.
					</p>
					<GoogleButton
						label="Continue with Google"
						variant="default"
						returnTo={`/hackathons/${page._id}`}
					/>
				</>
			);
		case "team":
			return (
				<p className="text-sm text-muted-foreground">You're on this startup.</p>
			);
		case "form":
			return <ApplyForm hackathonId={page._id} />;
		case "building":
			return (
				<>
					<p className="text-sm font-medium">{APPLY_COPY.building}</p>
					<Button asChild>
						<Link to="/h/$id" params={{ id: page._id }}>
							Open your Board
						</Link>
					</Button>
				</>
			);
		case "applied":
		case "declined":
			return <p className="text-sm">{APPLY_COPY[state]}</p>;
		case "closed":
			return (
				<p className="text-sm text-muted-foreground">
					{closedLabel(page.status === "building" ? "building" : "done")}
				</p>
			);
	}
}
