import type { Id } from "@convex/_generated/dataModel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import type { TeamSummary } from "~/features/teams/team/hooks/useTeams";
import { cn } from "~/lib/utils";

const NO_TEAM = "none";

type TeamPickerProps = {
	readonly teams: TeamSummary[] | undefined;
	readonly value: Id<"teams"> | null;
	readonly onChange: (teamId: Id<"teams"> | null) => void;
	readonly id?: string;
	readonly disabled?: boolean;
	readonly className?: string;
	readonly "aria-label"?: string;
};

/** Picks a Team or "No team". Renders nothing while the Startup has no Teams. */
export function TeamPicker({
	teams,
	value,
	onChange,
	id,
	disabled,
	className,
	"aria-label": ariaLabel,
}: TeamPickerProps) {
	if (!teams || teams.length === 0) {
		return null;
	}
	return (
		<Select
			value={value ?? NO_TEAM}
			disabled={disabled}
			onValueChange={(next) =>
				onChange(next === NO_TEAM ? null : (next as Id<"teams">))
			}
		>
			<SelectTrigger
				id={id}
				aria-label={ariaLabel}
				className={cn("h-11 w-full", className)}
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={NO_TEAM}>No team</SelectItem>
				{teams.map((team) => (
					<SelectItem key={team._id} value={team._id}>
						{team.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
