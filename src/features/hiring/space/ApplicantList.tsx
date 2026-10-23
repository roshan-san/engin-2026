import { PersonAvatar, PersonName } from "~/features/people";
import { tierText } from "~/features/work";
import { cn } from "~/lib/utils";
import type { ApplicantRow } from "./applicantSort";

const STATUS_LABEL = {
	applied: null,
	participating: "Participant",
	declined: "Declined",
	left: "Left",
} as const;

/** Everyone who applied; the active one is marked. */
export function ApplicantList({
	rows,
	activeId,
	onSelect,
}: {
	readonly rows: ApplicantRow[];
	readonly activeId: string | undefined;
	readonly onSelect: (
		applicationId: ApplicantRow["application"]["_id"],
	) => void;
}) {
	return (
		<ul aria-label="Applicants" className="flex flex-col gap-0.5 p-2">
			{rows.map(({ application, user }) => {
				const status = STATUS_LABEL[application.status];
				const isActive = application._id === activeId;
				return (
					<li key={application._id}>
						<button
							type="button"
							aria-current={isActive ? "true" : undefined}
							onClick={() => onSelect(application._id)}
							className={cn(
								"flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent focus-ring",
								isActive && "bg-accent",
								application.status === "declined" && "opacity-60",
							)}
						>
							<PersonAvatar person={user} size={32} />
							<PersonName
								person={user}
								className="min-w-0 flex-1 truncate text-sm"
							/>
							{status ? (
								<span className="shrink-0 text-xs text-muted-foreground">
									{status}
								</span>
							) : null}
							<span
								className={cn(
									"w-12 shrink-0 text-right text-xs tabular-nums",
									tierText(user.rating),
								)}
							>
								{user.rating}
							</span>
						</button>
					</li>
				);
			})}
		</ul>
	);
}
