import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { entryStatusLabel } from "~/features/hiring/entries/constants";
import { ApplyDialog } from "~/features/hiring/opportunities/components/ApplyDialog";
import { usePublicHackathon } from "~/features/hiring/opportunities/hooks/usePublicHackathon";
import {
	CONTRIBUTOR_IP_TERMS,
	PUBLIC_TRIAL_STATUS_LABELS,
} from "~/features/hiring/trialCycles/constants";
import { formatDate, formatDateRange } from "~/lib/dates";

type PublicHackathonPageProps = {
	readonly trialCycleId: string;
};

export function PublicHackathonPage({
	trialCycleId,
}: PublicHackathonPageProps) {
	const hackathon = usePublicHackathon(trialCycleId);

	if (hackathon === undefined) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-10">
				<PageLoading rows={6} />
			</div>
		);
	}

	if (!hackathon) {
		return (
			<div className="mx-auto max-w-lg px-4 py-20 text-center">
				<h1 className="text-2xl font-bold">Hackathon not found</h1>
				<Button asChild variant="outline" className="mt-6">
					<Link to="/discover">Back to Discover</Link>
				</Button>
			</div>
		);
	}

	const isOpen = hackathon.status === "open";
	const facts = [
		isOpen
			? { label: "Apply by", value: formatDate(hackathon.deadline) }
			: null,
		{
			label: "Dates",
			value: formatDateRange(hackathon.startsAt, hackathon.endsAt),
		},
		{
			label: "Participants",
			value: `${hackathon.participantCount}/${hackathon.maxContributors}`,
		},
		hackathon.prize ? { label: "Prize", value: hackathon.prize } : null,
	].filter((fact): fact is { label: string; value: string } => fact !== null);

	const details = [
		{ heading: "Expected outcome", body: hackathon.expectedOutcome },
		{ heading: "How work is evaluated", body: hackathon.evaluationCriteria },
		{ heading: "Compensation", body: hackathon.compensation },
	];

	return (
		<div className="mx-auto max-w-2xl space-y-10 px-4 py-10">
			<section className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant={isOpen ? "default" : "secondary"}>
						{PUBLIC_TRIAL_STATUS_LABELS[hackathon.status]}
					</Badge>
				</div>
				<h1 className="text-3xl font-bold break-words sm:text-4xl">
					{hackathon.title}
				</h1>
				<p className="text-muted-foreground">
					<Link
						to="/startup/$slug"
						params={{ slug: hackathon.startup.slug }}
						className="font-medium text-foreground hover:underline"
					>
						{hackathon.startup.name}
					</Link>
					{" · "}
					{hackathon.role.title}
					{hackathon.role.type ? ` (${hackathon.role.type})` : null}
				</p>
				<div className="flex flex-wrap items-center gap-2">
					{isOpen && hackathon.myEntryStatus === null ? (
						<ApplyDialog trialCycleId={hackathon._id} title={hackathon.title} />
					) : null}
					{hackathon.myEntryStatus ? (
						<>
							<Badge variant="outline">
								{entryStatusLabel(hackathon.myEntryStatus, hackathon.status)}
							</Badge>
							<Button asChild variant="outline" size="sm">
								<Link to="/my-entries">My Entries</Link>
							</Button>
						</>
					) : null}
					{hackathon.isMember ? (
						<Button asChild variant="outline" size="sm">
							<Link
								to="/s/$slug/trials/$trialCycleId"
								params={{
									slug: hackathon.startup.slug,
									trialCycleId: hackathon._id,
								}}
							>
								Manage
							</Link>
						</Button>
					) : null}
				</div>
			</section>

			<dl className="grid grid-cols-2 gap-4 rounded-xl border p-4 sm:grid-cols-4">
				{facts.map((fact) => (
					<div key={fact.label} className="min-w-0 space-y-1">
						<dt className="text-xs text-muted-foreground">{fact.label}</dt>
						<dd className="text-sm font-medium break-words">{fact.value}</dd>
					</div>
				))}
			</dl>

			<section className="space-y-2">
				<h2 className="text-lg font-semibold">About</h2>
				<p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
					{hackathon.description}
				</p>
			</section>

			<section className="space-y-3">
				<h2 className="text-lg font-semibold">Challenges</h2>
				{hackathon.challenges.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Challenges are announced when the hackathon starts.
					</p>
				) : (
					<ol className="space-y-2">
						{hackathon.challenges.map((challenge, index) => (
							<li
								key={challenge._id}
								className="flex gap-3 rounded-lg border p-4"
							>
								<span className="text-sm text-muted-foreground">
									{index + 1}.
								</span>
								<div className="min-w-0 space-y-1">
									<p className="font-medium break-words">{challenge.title}</p>
									{challenge.description ? (
										<p className="whitespace-pre-wrap text-sm text-muted-foreground">
											{challenge.description}
										</p>
									) : null}
								</div>
							</li>
						))}
					</ol>
				)}
			</section>

			{details.map(({ heading, body }) =>
				body ? (
					<section key={heading} className="space-y-2">
						<h2 className="text-lg font-semibold">{heading}</h2>
						<p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
							{body}
						</p>
					</section>
				) : null,
			)}

			<section className="space-y-2 rounded-xl border bg-muted/20 p-4">
				<h2 className="text-sm font-semibold">Your work stays yours</h2>
				<p className="text-sm text-muted-foreground">{CONTRIBUTOR_IP_TERMS}</p>
			</section>
		</div>
	);
}
