import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageLoading } from "~/components/globals/PageLoading";
import { Countdown } from "~/components/shared/Countdown.tsx";
import { GlowHero } from "~/components/shared/GlowHero";
import { LiveBadge } from "~/components/shared/LiveBadge";
import { Row, RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { CONTRIBUTOR_IP_TERMS } from "~/features/hiring/hackathons/constants";
import { applicationStatusLabel } from "~/features/hiring/myHackathons/constants";
import { ApplyDialog } from "~/features/hiring/opportunities/components/ApplyDialog";
import { usePublicHackathon } from "~/features/hiring/opportunities/hooks/usePublicHackathon";
import { nextMoment } from "~/features/hiring/opportunities/nextMoment";
import { formatDate, formatDateRange } from "~/lib/dates";

type PublicHackathonPageProps = {
	readonly hackathonId: string;
};

/** Fact values can be long prose; let them wrap inside a Row. */
function Wrapped({ children }: { readonly children: ReactNode }) {
	return (
		<span className="block whitespace-normal break-words">{children}</span>
	);
}

function TextSection({
	heading,
	children,
}: {
	readonly heading: string;
	readonly children: ReactNode;
}) {
	return (
		<section className="space-y-2">
			<SectionLabel>{heading}</SectionLabel>
			<p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
				{children}
			</p>
		</section>
	);
}

export function PublicHackathonPage({ hackathonId }: PublicHackathonPageProps) {
	const hackathon = usePublicHackathon(hackathonId);

	if (hackathon === undefined) {
		return (
			<div className="mx-auto max-w-5xl px-4 py-10">
				<PageLoading rows={6} />
			</div>
		);
	}

	if (!hackathon) {
		return (
			<div className="mx-auto max-w-lg px-4 py-20 text-center">
				<h1 className="text-xl font-semibold tracking-[-0.01em]">
					Hackathon not found
				</h1>
				<Button asChild variant="outline" className="mt-6">
					<Link to="/explore/hackathons">Back to Explore</Link>
				</Button>
			</div>
		);
	}

	const isOpen = hackathon.status === "open";
	const upcoming =
		isOpen || hackathon.status === "active"
			? nextMoment(hackathon, Date.now())
			: null;

	return (
		<div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
			<GlowHero
				eyebrow={<LiveBadge status={hackathon.status} />}
				title={<span className="break-words">{hackathon.title}</span>}
				subtitle={
					<Link
						to="/startup/$slug"
						params={{ slug: hackathon.startup.slug }}
						className="font-medium text-foreground hover:underline"
					>
						{hackathon.startup.name}
					</Link>
				}
			>
				<div className="space-y-5">
					{hackathon.prize ? (
						<p className="text-sm">
							<span className="text-muted-foreground">Prize </span>
							<span className="font-medium break-words">{hackathon.prize}</span>
						</p>
					) : null}
					{upcoming ? (
						<div className="space-y-2">
							<p className="text-xs text-muted-foreground">{upcoming.label}</p>
							<Countdown to={upcoming.at} />
						</div>
					) : null}
					<div className="flex flex-wrap items-center gap-2">
						{isOpen && hackathon.myApplicationStatus === null ? (
							<ApplyDialog
								hackathonId={hackathon._id}
								title={hackathon.title}
							/>
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
				</div>
			</GlowHero>

			<div className="grid gap-8 md:grid-cols-[1fr_280px]">
				<div className="min-w-0 space-y-8">
					<TextSection heading="About">{hackathon.description}</TextSection>

					<section className="space-y-2">
						<SectionLabel>Starter Tasks</SectionLabel>
						{hackathon.starterTasks.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Starter Tasks are announced when the Hackathon starts.
							</p>
						) : (
							<ol className="divide-y divide-border">
								{hackathon.starterTasks.map((starterTask, index) => (
									<li key={starterTask._id} className="flex gap-3 py-3">
										<span className="text-sm tabular-nums text-muted-foreground">
											{index + 1}.
										</span>
										<div className="min-w-0 space-y-1">
											<p className="text-sm font-medium break-words">
												{starterTask.title}
											</p>
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

					{hackathon.expectedOutcome ? (
						<TextSection heading="Expected outcome">
							{hackathon.expectedOutcome}
						</TextSection>
					) : null}
					{hackathon.evaluationCriteria ? (
						<TextSection heading="How work is evaluated">
							{hackathon.evaluationCriteria}
						</TextSection>
					) : null}

					<section className="space-y-2">
						<SectionLabel>Your work stays yours</SectionLabel>
						<p className="text-sm text-muted-foreground">
							{CONTRIBUTOR_IP_TERMS}
						</p>
					</section>
				</div>

				<aside className="min-w-0 space-y-2">
					<SectionLabel>Facts</SectionLabel>
					<RowList>
						{isOpen ? (
							<Row
								title={formatDate(hackathon.deadline)}
								meta="Apply by"
								className="py-2.5"
							/>
						) : null}
						<Row
							title={formatDateRange(hackathon.startsAt, hackathon.endsAt)}
							meta="Dates"
							className="py-2.5"
						/>
						<Row
							title={
								<span className="tabular-nums">
									{hackathon.participantCount} / {hackathon.maxParticipants}
								</span>
							}
							meta="Seats taken"
							className="py-2.5"
						/>
						{hackathon.compensation ? (
							<Row
								title={<Wrapped>{hackathon.compensation}</Wrapped>}
								meta="Compensation"
								className="py-2.5"
							/>
						) : null}
						<Row
							title={
								<Wrapped>
									{hackathon.role.title}
									{hackathon.role.type ? ` (${hackathon.role.type})` : null}
								</Wrapped>
							}
							meta="Role"
							className="py-2.5"
						/>
					</RowList>
				</aside>
			</div>
		</div>
	);
}
