import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import {
	Link,
	Navigate,
	useLocation,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { type ComponentType, type ReactNode, useEffect } from "react";
import {
	landingView,
	POST_INTENT_PATH,
	pickLanding,
	readLastPlace,
	START_INTENT_PATH,
	usePlaces,
} from "~/entities/place";
import { GoogleButton } from "~/features/sign-in";
import { cn } from "~/shared/lib/cn";
import { GlobalSpinner } from "~/shared/ui/GlobalSpinner";
import { TILE } from "~/shared/ui/tile";
import { BoardMock } from "./BoardMock";
import { OpenNow } from "./OpenNow";
import { Pricing } from "./Pricing";

const STEPS = [
	{
		title: "Post your real problem",
		body: "One or two weeks, on your real problem, with a handful of Builders.",
	},
	{
		title: "Builders ship on their own Boards",
		body: "Each works through the same Cards. You see what got done, Card by Card.",
	},
	{
		title: "Walkthrough, then a decision",
		body: "Talk through the work with your shortlist. Every Builder hears back.",
	},
] as const;

const AUDIENCES = [
	{
		title: "For Founders",
		lines: [
			"Set one goal each Cycle and ship it with your team.",
			"Show what got done, so your Record builds week by week.",
			"When you need someone, watch them work on your real problem first.",
		],
	},
	{
		title: "For Builders",
		lines: [
			"Work on a real startup problem, not a puzzle.",
			"You always hear back, whatever the decision.",
			"Approved work builds Momentum that follows you.",
		],
	},
] as const;

/** Sends a signed-in visitor to the place they were last in, else their first. */
function LandingRedirect() {
	const places = usePlaces();

	if (!places) {
		return <GlobalSpinner />;
	}

	return <Navigate to={pickLanding(places, readLastPlace())} replace />;
}

/**
 * Signs you out once Sign out's trip here wasn't stopped by unsaved work, then
 * drops the marker so coming Back to this entry later doesn't sign you out again.
 */
function SigningOut() {
	const { signOut } = useAuthActions();
	const navigate = useNavigate();
	const router = useRouter();

	useEffect(() => {
		void signOut().then(() => {
			if (router.state.location.state.signingOut) {
				void navigate({ to: "/", replace: true });
			}
		});
	}, [signOut, navigate, router]);

	return <GlobalSpinner />;
}

/** The landing page. Only the signed-out page sits in `Shell`; waiting and redirecting show bare. */
export function LandingPage({
	Shell,
}: {
	readonly Shell: ComponentType<{ readonly children: ReactNode }>;
}) {
	const auth = useConvexAuth();
	const signingOut = useLocation({
		select: (location) => location.state.signingOut === true,
	});
	const view = landingView(auth, signingOut);

	if (view === "wait") {
		return <GlobalSpinner />;
	}

	if (view === "signOut") {
		return <SigningOut />;
	}

	if (view === "redirect") {
		return <LandingRedirect />;
	}

	return (
		<Shell>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-4 py-12 md:gap-28 md:px-6 md:py-20">
				<section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
					<div className="flex flex-col gap-5">
						<p className="text-sm font-medium text-muted-foreground">
							The fast lane for founders
						</p>
						<h1 className="text-3xl font-semibold text-balance md:text-5xl">
							This is where it finally happens.
						</h1>
						<p className="text-lg text-muted-foreground text-pretty">
							Pick a goal on Monday. Ship it by Sunday. Do it again next week.
							When you need someone else on the team, watch them build before
							you decide.
						</p>
						<div className="flex flex-wrap items-center gap-3">
							<GoogleButton
								label="Start building"
								variant="default"
								size="lg"
								returnTo={START_INTENT_PATH}
							/>
							<Link
								to="/explore/hackathons"
								className="rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-ring"
							>
								Find a hackathon →
							</Link>
						</div>
					</div>
					<BoardMock />
				</section>

				<section className="flex max-w-2xl flex-col gap-4">
					<h2 className="text-2xl font-semibold">Why engin exists</h2>
					<div className="flex flex-col gap-3 text-muted-foreground">
						<p>
							A startup is two things: what you ship and who you talk to.
							Everything else can wait.
						</p>
						<p>
							I built engin to keep the first of those moving, one week at a
							time, with a small team and nothing to hide behind. When it's time
							to bring someone in, you see their work first, and they always
							hear back.
						</p>
						<p>If you've been meaning to start, start here.</p>
					</div>
					<p className="text-sm font-medium">Roshan, founder of engin</p>
				</section>

				<section className="flex flex-col gap-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 className="text-2xl font-semibold">
							Bring builders in with a Hackathon
						</h2>
						<GoogleButton
							label="Post a hackathon"
							size="sm"
							returnTo={POST_INTENT_PATH}
						/>
					</div>
					<ol className="grid gap-3 md:grid-cols-3">
						{STEPS.map((step, index) => (
							<li key={step.title} className={cn(TILE, "flex flex-col gap-2")}>
								<span className="text-sm font-semibold tabular-nums text-muted-foreground">
									{index + 1}
								</span>
								<p className="font-medium">{step.title}</p>
								<p className="text-sm text-muted-foreground">{step.body}</p>
							</li>
						))}
					</ol>
				</section>

				<section className="grid gap-3 md:grid-cols-2">
					{AUDIENCES.map((audience) => (
						<div
							key={audience.title}
							className={cn(TILE, "flex flex-col gap-3 p-6")}
						>
							<h2 className="text-lg font-semibold">{audience.title}</h2>
							<ul className="flex flex-col gap-2 text-sm text-muted-foreground">
								{audience.lines.map((line) => (
									<li key={line}>{line}</li>
								))}
							</ul>
						</div>
					))}
				</section>

				<OpenNow />
				<Pricing />

				<section
					className={cn(
						TILE,
						"flex flex-col items-center gap-4 px-6 py-12 text-center",
					)}
				>
					<h2 className="text-2xl font-semibold text-balance">
						Start this week.
					</h2>
					<GoogleButton
						label="Start building"
						variant="default"
						size="lg"
						returnTo={START_INTENT_PATH}
					/>
				</section>
			</div>
		</Shell>
	);
}
