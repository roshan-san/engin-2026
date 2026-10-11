import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { displayName } from "~/features/work/cards/displayName";
import { initials } from "~/lib/initials";
import { cn } from "~/lib/utils";
import type { ApplicantRow } from "./applicantSort";

const STATUS_LABEL = {
	applied: null,
	building: "Builder",
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
								"flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60",
								isActive && "bg-accent",
								application.status === "declined" && "opacity-60",
							)}
						>
							<Avatar className="size-7">
								{user.image ? <AvatarImage src={user.image} alt="" /> : null}
								<AvatarFallback className="text-[10px]">
									{initials(user.name, user.username)}
								</AvatarFallback>
							</Avatar>
							<span className="min-w-0 flex-1 truncate text-sm">
								{displayName(user)}
							</span>
							{status ? (
								<span className="shrink-0 text-xs text-muted-foreground">
									{status}
								</span>
							) : null}
							<span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
								{user.rating}
							</span>
						</button>
					</li>
				);
			})}
		</ul>
	);
}
