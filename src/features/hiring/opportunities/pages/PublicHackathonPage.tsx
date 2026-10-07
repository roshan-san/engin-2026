import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { applicationStatusLabel } from "~/features/hiring/myHackathons/constants";
import { ApplyDialog } from "~/features/hiring/opportunities/components/ApplyDialog";
import { usePublicHackathon } from "~/features/hiring/opportunities/hooks/usePublicHackathon";
import {
	CONTRIBUTOR_IP_TERMS,
	PUBLIC_HACKATHON_STATUS_LABELS,
} from "~/features/hiring/hackathons/constants";
import { formatDate, formatDateRange } from "~/lib/dates";

type PublicHackathonPageProps = {
	readonly hackathonId: string;
};

export function PublicHackathonPage({ hackathonId }: PublicHackathonPageProps) {
	const hackathon = usePublicHackathon(hackathonId);

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
			value: `${hackathon.participantCount}/${hackathon.maxParticipants}`,
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
						{PUBLIC_HACKATHON_STATUS_LABELS[hackathon.status]}
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
					{isOpen && hackathon.myApplicationStatus === null ? (
						<ApplyDialog hackathonId={hackathon._id} title={hackathon.title} />
					) : null}
					{hackathon.myApplicationStatus ? (
						<>
							<Badge variant="outline">
								{applicationStatusLabel(
									hackathon.myApplicationStatus,
									hackathon.status,
								)}
							</Badge>
							<Button asChild variant="outline" size="sm">
								<Link to="/my-hackathons">My Hackathons</Link>
							</Button>
						</>
					) : null}
					{hackathon.isMember ? (
						<Button asChild variant="outline" size="sm">
							<Link
								to="/s/$slug/hackathons/$hackathonId"
								params={{
									slug: hackathon.startup.slug,
									hackathonId: hackathon._id,
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
				<h2 className="text-lg font-semibold">Starter Tasks</h2>
				{hackathon.starterTasks.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Starter Tasks are announced when the Hackathon starts.
					</p>
				) : (
					<ol className="space-y-2">
						{hackathon.starterTasks.map((starterTask, index) => (
							<li
								key={starterTask._id}
								className="flex gap-3 rounded-lg border p-4"
							>
								<span className="text-sm text-muted-foreground">
									{index + 1}.
								</span>
								<div className="min-w-0 space-y-1">
									<p className="font-medium break-words">{starterTask.title}</p>
									{starterTask.description ? (
										<p className="whitespace-pre-wrap text-sm text-muted-foreground">
											{starterTask.description}
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
