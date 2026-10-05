import { Link } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	TRIAL_STATUS_LABELS,
	type TrialStatus,
} from "~/features/hiring/trialCycles/constants";
import { formatDate, formatDateRange } from "~/lib/dates";

type TrialHeaderProps = {
	readonly trial: {
		_id: string;
		title: string;
		status: TrialStatus;
		roleTitle: string;
		startupSlug: string;
		startsAt: number;
		endsAt: number;
		applicationDeadline?: number;
		participantCount: number;
		maxContributors: number;
		isFounder: boolean;
	};
	/** Opens the close form; offered to Founders while the hackathon runs. */
	readonly onClose?: () => void;
};

export function TrialHeader({ trial, onClose }: TrialHeaderProps) {
	const isDraft = trial.status === "draft";
	const facts = [
		{
			label: "Dates",
			value: formatDateRange(trial.startsAt, trial.endsAt),
		},
		{
			label: "Apply by",
			value: formatDate(trial.applicationDeadline ?? trial.startsAt),
		},
		{
			label: "Participants",
			value: `${trial.participantCount} / ${trial.maxContributors}`,
		},
	];

	return (
		<header className="space-y-4">
			<div className="space-y-2">
				<Badge variant={trial.status === "open" ? "default" : "secondary"}>
					{TRIAL_STATUS_LABELS[trial.status]}
				</Badge>
				<h1 className="text-xl font-semibold break-words">{trial.title}</h1>
				<p className="text-sm text-muted-foreground">{trial.roleTitle}</p>
			</div>
			<dl className="grid grid-cols-2 gap-4 rounded-xl border p-4 sm:grid-cols-3">
				{facts.map((fact) => (
					<div key={fact.label} className="min-w-0 space-y-1">
						<dt className="text-xs text-muted-foreground">{fact.label}</dt>
						<dd className="text-sm font-medium break-words">{fact.value}</dd>
					</div>
				))}
			</dl>
			<div className="flex flex-wrap gap-2">
				{trial.isFounder && trial.status === "active" && onClose ? (
					<Button type="button" size="sm" onClick={onClose}>
						Close with Verdicts
					</Button>
				) : null}
				{isDraft ? null : (
					<Button asChild variant="outline" size="sm">
						<Link
							to="/hackathons/$trialCycleId"
							params={{ trialCycleId: trial._id }}
						>
							Public page
						</Link>
					</Button>
				)}
				{isDraft && trial.isFounder ? (
					<Button asChild variant="outline" size="sm">
						<Link
							to="/s/$slug/hiring/$trialCycleId/edit"
							params={{ slug: trial.startupSlug, trialCycleId: trial._id }}
						>
							Edit
						</Link>
					</Button>
				) : null}
			</div>
		</header>
	);
}
