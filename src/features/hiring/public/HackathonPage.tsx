import { useConvexAuth } from "@convex-dev/auth/react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { AppPage } from "~/components/AppPage";
import { DetailPanel } from "~/components/DetailPanel";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { Page } from "~/components/Page";
import { PanelHeader } from "~/components/PanelHeader";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useDetailPanel } from "~/components/useDetailPanel";
import { GoogleButton } from "~/features/people/auth/GoogleButton";
import { hiringLine } from "~/features/startups/public/hiringLine";
import { RatingBadge } from "~/features/work/activity/RatingBadge";
import { initials } from "~/lib/initials";
import { dayLabel, lastDay } from "../hackathonDates";
import { roleLabel } from "../jobChips";
import { STAGE } from "../stage";
import { ApplyForm } from "./ApplyForm";
import { APPLY_COPY, applyState, closedLabel } from "./applyStatus";
import { HackathonPost } from "./HackathonPost";
import { useHackathon } from "./useHackathon";

const route = getRouteApi("/_shell/hackathons/$id");

type HackathonView = NonNullable<ReturnType<typeof useHackathon>>;

/** A Hackathon's post. Signed in, the app shape with Apply in the detail panel; signed out, a public page with the brief behind Sign in. */
export function HackathonPage() {
	const { id } = route.useParams();
	const page = useHackathon(id);

	if (page === undefined) {
		return <GlobalSpinner fill />;
	}
	if (page === null) {
		return <GlobalNotFound />;
	}

	// The query sends the Cards only to people who are signed in.
	return page.cards === null ? (
		<SignedOutPage page={page} />
	) : (
		<SignedInPage page={page} />
	);
}

function postOf(page: HackathonView) {
	return {
		startupName: page.startup.name,
		job: page.job,
		problem: page.problem,
		cards: page.cards,
		weeks: page.weeks,
		startsAt: page.startsAt,
		buildersGet: page.buildersGet,
	};
}

/** `Frontend · Acme [Open]` over the post; Apply and the Startup in the detail panel, open on desktop and behind Apply on a phone. */
function SignedInPage({ page }: { readonly page: HackathonView }) {
	const panel = useDetailPanel(false, () => {});
	const stage = STAGE[page.status];

	return (
		<AppPage
			bar={{
				title: (
					<h1 className="truncate text-sm font-medium">
						{roleLabel(page.job.role)}
						<span className="text-muted-foreground">
							{" "}
							· {page.startup.name}
						</span>
					</h1>
				),
				badge: (
					<Badge variant="status" tone={stage.tone} className="shrink-0">
						{stage.label}
					</Badge>
				),
				actions: (
					<Button size="sm" className="md:hidden" onClick={panel.open}>
						Apply
					</Button>
				),
			}}
			panel={
				<DetailPanel
					shows={panel.shows}
					title="Apply"
					description="Apply, and who's hiring."
					onClose={panel.close}
					hasCloseButton
					item={null}
					fallback={
						<div className="flex min-h-0 flex-1 flex-col">
							<PanelHeader>
								<h2 className="text-sm font-medium">Apply</h2>
							</PanelHeader>
							<div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
								<div className="flex flex-col gap-3">
									<ApplyCard page={page} />
								</div>
								<StartupCard page={page} />
							</div>
						</div>
					}
				/>
			}
		>
			<HackathonPost post={postOf(page)} />
		</AppPage>
	);
}

/** The public page: the post with its brief behind Sign in, beside Apply and the Startup. */
function SignedOutPage({ page }: { readonly page: HackathonView }) {
	return (
		<Page className="max-w-6xl">
			<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
				<HackathonPost post={postOf(page)} />

				<aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
					<div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
						<ApplyCard page={page} />
					</div>
					<StartupCard page={page} />
				</aside>
			</div>
		</Page>
	);
}

/** Who's hiring: the Startup, its Rating and how its past Hackathons went. */
function StartupCard({ page }: { readonly page: HackathonView }) {
	const hiring = hiringLine(page.hiringRecord);

	return (
		<Link
			to="/startups/$slug"
			params={{ slug: page.startup.slug }}
			className="flex flex-col gap-4 rounded-xl border border-border p-5 outline-none transition-colors hover:border-input focus-visible:ring-2 focus-visible:ring-ring/60"
		>
			<div className="flex items-center gap-3">
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
						<span className="line-clamp-2 text-xs text-muted-foreground">
							{page.startup.oneLiner}
						</span>
					) : null}
				</div>
			</div>
			<RatingBadge
				size="sm"
				rating={page.startup.rating}
				ratingChange={page.startup.ratingChange}
				isProvisional={page.startup.isProvisional}
			/>
			<p className="text-xs text-muted-foreground">
				{hiring ?? "Their first hackathon."}
			</p>
		</Link>
	);
}

function ApplyCard({ page }: { readonly page: HackathonView }) {
	const { isAuthenticated } = useConvexAuth();
	const state = applyState(page, isAuthenticated);

	switch (state) {
		case "sign_in":
			return (
				<>
					<ApplyHeading page={page} />
					<p className="text-sm text-muted-foreground">
						Build on real work. Get hired on what you ship.
					</p>
					<GoogleButton
						variant="default"
						returnTo={`/hackathons/${page._id}`}
					/>
				</>
			);
		case "team":
			return (
				<>
					<ApplyHeading page={page} />
					<p className="text-sm text-muted-foreground">
						You're on this startup.
					</p>
				</>
			);
		case "form":
			return (
				<>
					<ApplyHeading page={page} />
					<ApplyForm hackathonId={page._id} />
				</>
			);
		case "building":
			return (
				<>
					<p className="text-sm font-medium">{APPLY_COPY.building}</p>
					<p className="text-sm text-muted-foreground">
						Your Cards are on your Board.
					</p>
					<Button asChild>
						<Link to="/h/$id" params={{ id: page._id }}>
							Open your Board
						</Link>
					</Button>
				</>
			);
		case "applied":
			return (
				<>
					<p className="text-sm font-medium">{APPLY_COPY.applied}</p>
					<p className="text-sm text-muted-foreground">
						It starts {dayLabel(page.startsAt)}.
					</p>
				</>
			);
		case "declined":
			return <p className="text-sm">{APPLY_COPY.declined}</p>;
		case "closed":
			return (
				<>
					<p className="text-sm font-medium">
						{closedLabel(page.status === "building" ? "building" : "done")}
					</p>
					<p className="text-sm text-muted-foreground">
						Applications are closed.
					</p>
				</>
			);
	}
}

/** "Apply by Sun, Oct 11 · 12 applied". */
function ApplyHeading({ page }: { readonly page: HackathonView }) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<p className="text-sm font-medium">
				Apply by {dayLabel(lastDay(page.startsAt))}
			</p>
			<p className="shrink-0 text-xs text-muted-foreground tabular-nums">
				{page.applicantCount} applied
			</p>
		</div>
	);
}
