import { phaseOf } from "@convex/shared/hackathonPhase";
import { MAX_PARTICIPANTS } from "@convex/shared/limits";
import { useConvexAuth } from "@convex-dev/auth/react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { AppPage } from "~/components/AppPage";
import { DetailPanel } from "~/components/DetailPanel";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { Page } from "~/components/Page";
import { PanelBody } from "~/components/PanelBody";
import { PanelHeader } from "~/components/PanelHeader";
import { PlaceLogo } from "~/components/PlaceLogo";
import { TILE, TILE_LINK } from "~/components/tile";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useDetailPanel } from "~/components/useDetailPanel";
import { GoogleButton } from "~/features/people/auth/GoogleButton";
import { hiringLine } from "~/features/startups/public/hiringLine";
import { RatingBadge } from "~/features/work/activity/RatingBadge";
import { dayLabel } from "~/lib/dates";
import { cn } from "~/lib/utils";
import { lastDay } from "../hackathonDates";
import { roleLabel } from "../jobChips";
import { STAGE } from "../stage";
import { ApplyForm } from "./ApplyForm";
import {
	APPLY_COPY,
	applyBarAction,
	applyPanelTitle,
	applyState,
	closedLabel,
} from "./applyStatus";
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
		participantsGet: page.participantsGet,
	};
}

/** `Frontend · Acme [Open]` over the post; Apply and the Startup in the detail panel, open on desktop and behind Apply on a phone. */
function SignedInPage({ page }: { readonly page: HackathonView }) {
	const panel = useDetailPanel(false, () => {});
	const stage = STAGE[phaseOf(page, Date.now())];
	const state = applyState(page, true);
	const action = applyBarAction(state);
	const panelTitle = applyPanelTitle(state);

	return (
		<AppPage
			bar={{
				title: (
					<p className="truncate text-sm font-medium">
						{roleLabel(page.job.role)}
						<span className="text-muted-foreground">
							{" "}
							· {page.startup.name}
						</span>
					</p>
				),
				badge: (
					<Badge variant="status" tone={stage.tone} className="shrink-0">
						{stage.label}
					</Badge>
				),
				actions:
					action?.kind === "panel" ? (
						<Button size="sm" className="md:hidden" onClick={panel.open}>
							{action.label}
						</Button>
					) : action?.kind === "board" ? (
						<Button asChild size="sm">
							<Link to="/h/$id" params={{ id: page._id }}>
								Open your Board
							</Link>
						</Button>
					) : (
						<Button
							variant="ghost"
							size="sm"
							className="md:hidden"
							onClick={panel.open}
						>
							Details
						</Button>
					),
			}}
			panel={
				<DetailPanel
					shows={panel.shows}
					title={panelTitle}
					description="Apply, and who's hiring."
					onClose={panel.close}
					hasCloseButton
					item={null}
					fallback={
						<div className="flex min-h-0 flex-1 flex-col">
							<PanelHeader>
								<h2 className="text-sm font-medium">{panelTitle}</h2>
							</PanelHeader>
							<PanelBody>
								<div className="flex flex-col gap-3">
									<ApplyCard page={page} />
								</div>
								<StartupCard page={page} />
							</PanelBody>
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
					<div className={cn(TILE, "flex flex-col gap-3")}>
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
			className={cn(TILE_LINK, "flex flex-col gap-4")}
		>
			<div className="flex items-center gap-3">
				<PlaceLogo name={page.startup.name} url={page.startup.logo} size={40} />
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
		case "participating":
			return (
				<>
					<p className="text-sm font-medium">{APPLY_COPY.participating}</p>
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
						The Founder picks up to {MAX_PARTICIPANTS} before it starts on{" "}
						{dayLabel(page.startsAt)}. You'll see the answer on Home.
					</p>
				</>
			);
		case "declined":
			return <p className="text-sm">{APPLY_COPY.declined}</p>;
		case "closed":
			return (
				<>
					<p className="text-sm font-medium">
						{closedLabel(closedPhase(page))}
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

/** The phases a Hackathon closed to applicants can be in. */
function closedPhase(page: HackathonView): "live" | "deciding" | "done" {
	const phase = phaseOf(page, Date.now());
	return phase === "live" || phase === "deciding" ? phase : "done";
}
