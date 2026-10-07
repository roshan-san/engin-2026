import type { Doc } from "@convex/_generated/dataModel";
import { Row } from "~/components/shared/RowList";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { ROLE_TYPES } from "~/features/hiring/roles/constants";
import { TeamChip } from "~/features/teams/team/components/TeamChip";
import { TeamPicker } from "~/features/teams/team/components/TeamPicker";
import type { TeamSummary } from "~/features/teams/team/hooks/useTeams";
import { cn } from "~/lib/utils";

type RoleRowProps = {
	readonly role: Doc<"roles">;
	readonly isFounder: boolean;
	readonly isClosing: boolean;
	readonly onClose: () => void;
	readonly teams: TeamSummary[] | undefined;
	readonly onSetTeam: (teamId: TeamSummary["_id"] | null) => void;
};

export function RoleRow({
	role,
	isFounder,
	isClosing,
	onClose,
	teams,
	onSetTeam,
}: RoleRowProps) {
	const teamName = teams?.find((team) => team._id === role.teamId)?.name;
	const isOpen = role.status === "open";
	const typeLabel =
		ROLE_TYPES.find((type) => type.value === role.type)?.label ?? role.type;

	return (
		<Row
			className={cn(!isOpen && "opacity-70")}
			title={role.title}
			meta={
				<span className="whitespace-normal">
					{[
						typeLabel,
						`${role.headcount} to hire`,
						...(role.skills.length > 0 ? [role.skills.join(", ")] : []),
					].join(" · ")}
				</span>
			}
			trailing={
				<div className="flex items-center gap-2">
					{isFounder ? (
						<TeamPicker
							aria-label={`Team for ${role.title}`}
							teams={teams}
							value={role.teamId ?? null}
							onChange={onSetTeam}
							className="h-8 w-32"
						/>
					) : teamName ? (
						<TeamChip name={teamName} />
					) : null}
					{isOpen ? (
						isFounder ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={isClosing}
								onClick={onClose}
							>
								{isClosing ? <Spinner /> : null}
								Close
							</Button>
						) : null
					) : (
						"Closed"
					)}
				</div>
			}
		/>
	);
}
