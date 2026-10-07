import { Link } from "@tanstack/react-router";
import { Countdown } from "~/components/shared/Countdown";
import { GlowHero } from "~/components/shared/GlowHero";
import { LiveBadge } from "~/components/shared/LiveBadge";
import { Button } from "~/components/ui/button";
import type { HackathonStatus } from "~/features/hiring/hackathons/constants";
import { formatDate, formatDateRange } from "~/lib/dates";

type HackathonHeaderProps = {
	readonly hackathon: {
		_id: string;
		title: string;
		status: HackathonStatus;
		roleTitle: string;
		startupSlug: string;
		startsAt: number;
		endsAt: number;
		applicationDeadline?: number;
		participantCount: number;
		maxParticipants: number;
		isFounder: boolean;
		/** The expected outcome, as its Cycle's goal once published. */
		goal: string | null;
	};
	/** Opens the close form; offered to Founders while the hackathon runs. */
	readonly onClose?: () => void;
	/** Tasks still in Review: the close waits until a Founder resolves them. */
	readonly reviewCount: number;
	/** Shows every lane's Review column on the board. */
	readonly onShowReview: () => void;
};

export function HackathonHeader({
	hackathon,
	onClose,
	reviewCount,
	onShowReview,
}: HackathonHeaderProps) {
	const isDraft = hackathon.status === "draft";
	const facts = [
		{
			label: "Dates",
			value: formatDateRange(hackathon.startsAt, hackathon.endsAt),
		},
		{
			label: "Apply by",
			value: formatDate(hackathon.applicationDeadline ?? hackathon.startsAt),
		},
		{
			label: "Participants",
			value: `${hackathon.participantCount} / ${hackathon.maxParticipants}`,
		},
	];

	const showsCountdown =
		hackathon.status === "active" && hackathon.endsAt > Date.now();

	return (
		<GlowHero
			size="compact"
			eyebrow={<LiveBadge status={hackathon.status} />}
			title={<span className="break-words">{hackathon.title}</span>}
			subtitle={<span className="break-words">{hackathon.roleTitle}</span>}
		>
			<div className="space-y-5">
				{hackathon.goal && !isDraft ? (
					<p className="break-words">{hackathon.goal}</p>
				) : null}
				<dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
					{facts.map((fact) => (
						<div key={fact.label} className="min-w-0 space-y-1">
							<dt className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
								{fact.label}
							</dt>
							<dd className="text-sm font-medium tabular-nums break-words">
								{fact.value}
							</dd>
						</div>
					))}
				</dl>
				{hackathon.status === "active" ? (
					<div className="space-y-2">
						<p className="text-xs text-muted-foreground">
							Running until {formatDate(hackathon.endsAt)}
						</p>
						{showsCountdown ? <Countdown to={hackathon.endsAt} /> : null}
					</div>
				) : null}
				<div className="flex flex-wrap items-center gap-2">
					{hackathon.isFounder && hackathon.status === "active" && onClose ? (
						<>
							<Button
								type="button"
								size="sm"
								disabled={reviewCount > 0}
								aria-describedby={
									reviewCount > 0 ? "close-blocked-by-review" : undefined
								}
								onClick={onClose}
							>
								Close with Verdicts
							</Button>
							{reviewCount > 0 ? (
								<Button
									id="close-blocked-by-review"
									type="button"
									size="sm"
									variant="link"
									className="px-0"
									onClick={onShowReview}
								>
									{reviewCount} {reviewCount === 1 ? "Task" : "Tasks"} still in
									Review
								</Button>
							) : null}
						</>
					) : null}
					{isDraft ? null : (
						<Button asChild variant="outline" size="sm">
							<Link
								to="/hackathons/$hackathonId"
								params={{ hackathonId: hackathon._id }}
							>
								Public page
							</Link>
						</Button>
					)}
					{isDraft && hackathon.isFounder ? (
						<Button asChild variant="outline" size="sm">
							<Link
								to="/s/$slug/hiring/$hackathonId/edit"
								params={{
									slug: hackathon.startupSlug,
									hackathonId: hackathon._id,
								}}
							>
								Edit
							</Link>
						</Button>
					) : null}
				</div>
			</div>
		</GlowHero>
	);
}
