import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { AppPage } from "~/components/AppPage";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { PlaceLogo } from "~/components/PlaceLogo";
import { SectionLabel } from "~/components/SectionLabel";
import { UnreadDot } from "~/components/UnreadDot";
import { Button } from "~/components/ui/button";
import { builderStatusText } from "~/features/hiring/builder/builderStatus";
import { roleLabel } from "~/features/hiring/jobChips";
import { tierText } from "~/features/work/activity/tierText";
import { cn } from "~/lib/utils";
import { isWaiting, type Places, reasonLine } from "~/shell/places";
import { useMe } from "~/shell/useMe";
import { usePlaces } from "~/shell/usePlaces";
import { greeting } from "./greeting";
import { homeSections } from "./homeSections";

const CARD =
	"flex flex-col gap-3 rounded-xl border border-border bg-card p-4 outline-none transition-colors hover:border-foreground/20 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring/60";

/** Where you work, and what's waiting on you in each place. */
export function HomePage() {
	const places = usePlaces();
	const me = useMe();

	if (places === undefined || me === undefined) {
		return <GlobalSpinner fill />;
	}
	const now = Date.now();
	const { welcome, applications } = homeSections(places);

	return (
		<AppPage
			bar={{
				title: (
					<h1 className="truncate text-sm font-medium">
						{greeting(now, me?.name ?? null)}
					</h1>
				),
			}}
		>
			<div className="flex flex-col gap-10">
				{welcome ? <TwoWaysIn /> : <YourPlaces places={places} now={now} />}
				{applications ? <Applications applied={places.applied} /> : null}
			</div>
		</AppPage>
	);
}

function YourPlaces({
	places,
	now,
}: {
	readonly places: Places;
	readonly now: number;
}) {
	return (
		<div className="flex flex-col gap-10">
			<Section label="Your startups">
				{places.startups.length === 0 ? (
					<StartCard />
				) : (
					places.startups.map((startup) => (
						<Link
							key={startup.startupId}
							to="/s/$slug/board"
							params={{ slug: startup.slug }}
							className={CARD}
						>
							<div className="flex items-center gap-3">
								<PlaceLogo
									name={startup.name}
									url={startup.logoUrl}
									size="lg"
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">{startup.name}</p>
									<p className="text-xs text-muted-foreground">
										{startup.role === "founder" ? "Founder" : "Contributor"}
									</p>
								</div>
								<span
									className={cn(
										"text-sm font-semibold tabular-nums",
										tierText(startup.rating),
									)}
								>
									{startup.rating}
								</span>
							</div>
							<Waiting place={startup} />
						</Link>
					))
				)}
			</Section>
			<Section label="Hackathons you're building in">
				{places.building.length === 0 ? (
					<FindCard />
				) : (
					places.building.map((hackathon) => (
						<Link
							key={hackathon.hackathonId}
							to="/h/$id"
							params={{ id: hackathon.hackathonId }}
							className={CARD}
						>
							<div className="flex items-center gap-3">
								<PlaceLogo
									name={hackathon.startupName}
									url={hackathon.startupLogoUrl}
									size="lg"
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">
										{roleLabel(hackathon.job.role)}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{hackathon.startupName}
									</p>
								</div>
								<span className="shrink-0 text-xs text-muted-foreground">
									{builderStatusText(hackathon, hackathon.decision, now)}
								</span>
							</div>
							<Waiting place={hackathon} />
						</Link>
					))
				)}
			</Section>
		</div>
	);
}

/** Hackathons you applied to and haven't started building in. */
function Applications({ applied }: { readonly applied: Places["applied"] }) {
	return (
		<section className="flex flex-col gap-2">
			<SectionLabel>Your applications</SectionLabel>
			<ul className="divide-y divide-border rounded-xl border border-border">
				{applied.map((hackathon) => (
					<li key={hackathon.hackathonId}>
						<Link
							to="/hackathons/$id"
							params={{ id: hackathon.hackathonId }}
							className="flex items-center gap-3 px-4 py-3 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60"
						>
							<PlaceLogo
								name={hackathon.startupName}
								url={hackathon.startupLogoUrl}
								size="sm"
							/>
							<span className="min-w-0 flex-1 truncate">
								{roleLabel(hackathon.job.role)} · {hackathon.startupName}
							</span>
							<span className="shrink-0 text-xs text-muted-foreground">
								{hackathon.status === "applied" ? "Applied" : "Not this time"}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}

function Section({
	label,
	children,
}: {
	readonly label: string;
	readonly children: ReactNode;
}) {
	return (
		<section className="flex flex-col gap-2">
			<SectionLabel>{label}</SectionLabel>
			<div className="grid gap-3 sm:grid-cols-2">{children}</div>
		</section>
	);
}

/** What's waiting there, in words; a calm line when nothing is. */
function Waiting({
	place,
}: {
	readonly place: Places["startups"][number] | Places["building"][number];
}) {
	if (!isWaiting(place)) {
		return (
			<p className="text-xs text-muted-foreground">Nothing waiting on you</p>
		);
	}
	return (
		<ul className="flex flex-col gap-1">
			{place.waiting.map((reason, index) => (
				<li
					// Two same-role Hackathons can produce identical lines, so the index keeps keys unique.
					// biome-ignore lint/suspicious/noArrayIndexKey: the list is static between renders
					key={`${reason.kind}-${index}`}
					className="flex items-center gap-2 text-sm"
				>
					<UnreadDot />
					{reasonLine(reason)}
				</li>
			))}
		</ul>
	);
}

function StartCard() {
	return (
		<div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-4">
			<p className="text-sm">
				Run your startup's week here, and hire by watching people build.
			</p>
			<Button asChild size="sm">
				<Link to="/onboarding">
					<Plus />
					Start a startup
				</Link>
			</Button>
		</div>
	);
}

function FindCard() {
	return (
		<div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-4">
			<p className="text-sm">
				Build on a startup's real problem, and get a Decision either way.
			</p>
			<Button asChild size="sm" variant="outline">
				<Link to="/explore/hackathons">
					<Compass />
					Find a hackathon
				</Link>
			</Button>
		</div>
	);
}

/** A first visit: the two ways in, side by side. */
function TwoWaysIn() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-xl font-semibold tracking-tight">
					Welcome to engin
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Pick where to start. You can do both later.
				</p>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<Link to="/onboarding" className={CARD}>
					<p className="font-medium">I'm a Founder</p>
					<p className="text-sm text-muted-foreground">
						Set up your startup, run your week on a Board, and hire through
						small hiring Hackathons.
					</p>
					<span className="mt-auto flex items-center gap-1 text-sm font-medium">
						Start a startup <ArrowRight className="size-4" />
					</span>
				</Link>
				<Link to="/explore/hackathons" className={CARD}>
					<p className="font-medium">I want to build</p>
					<p className="text-sm text-muted-foreground">
						Join a startup's hiring Hackathon, ship on your own Board, and earn
						a Rating.
					</p>
					<span className="mt-auto flex items-center gap-1 text-sm font-medium">
						Find a hackathon <ArrowRight className="size-4" />
					</span>
				</Link>
			</div>
		</div>
	);
}
