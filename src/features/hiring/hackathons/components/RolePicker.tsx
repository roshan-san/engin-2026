import type { Id } from "@convex/_generated/dataModel";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Field, FieldLabel } from "~/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { NewRoleForm } from "~/features/hiring/roles/components/NewRoleForm";
import { useRoles } from "~/features/hiring/roles/hooks/useRoles";
import { useTeams } from "~/features/teams/team/hooks/useTeams";

type RolePickerProps = {
	readonly startupId: Id<"startups">;
	readonly value: string;
	readonly onChange: (roleId: Id<"roles">) => void;
	readonly disabled?: boolean;
};

/** Open Roles to pick from, with "+ New Role" inline; a new Role is selected. */
export function RolePicker({
	startupId,
	value,
	onChange,
	disabled,
}: RolePickerProps) {
	const { openRoles } = useRoles(startupId);
	const { teamNames } = useTeams(startupId);
	// null = untouched: the inline form starts open only when there's nothing to pick.
	const [isAdding, setIsAdding] = useState<boolean | null>(null);

	if (openRoles === undefined) {
		return <Skeleton className="h-11 w-full" />;
	}

	const hasOpenRoles = openRoles.length > 0;
	const showForm = isAdding ?? !hasOpenRoles;
	const pickedTeamId = openRoles.find((role) => role._id === value)?.teamId;
	const pickedTeam = pickedTeamId ? teamNames.get(pickedTeamId) : undefined;

	return (
		<div className="flex flex-col gap-3">
			{hasOpenRoles ? (
				<Field>
					<FieldLabel htmlFor="hackathon-role">Role</FieldLabel>
					<Select
						value={value}
						disabled={disabled}
						onValueChange={(roleId) => {
							// A just-created Role is picked before its option renders, and
							// Radix reports "" for it in between; keep the pick.
							if (roleId) {
								onChange(roleId as Id<"roles">);
							}
						}}
					>
						<SelectTrigger id="hackathon-role" className="h-11 w-full">
							<SelectValue placeholder="Pick the Role you're hiring for" />
						</SelectTrigger>
						<SelectContent>
							{openRoles.map((role) => (
								<SelectItem key={role._id} value={role._id}>
									{role.title}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{pickedTeam ? (
						<p className="text-xs text-muted-foreground">
							Team: <span className="text-foreground">{pickedTeam}</span>
						</p>
					) : null}
				</Field>
			) : (
				<p className="text-sm text-muted-foreground">
					Every hackathon hires for a Role. Create your first one.
				</p>
			)}

			{showForm ? (
				<div className="pt-3">
					<NewRoleForm
						startupId={startupId}
						onCreated={(roleId) => {
							onChange(roleId);
							setIsAdding(false);
						}}
						onCancel={hasOpenRoles ? () => setIsAdding(false) : undefined}
					/>
				</div>
			) : (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="self-start"
					disabled={disabled}
					onClick={() => setIsAdding(true)}
				>
					<Plus />
					New Role
				</Button>
			)}
		</div>
	);
}
