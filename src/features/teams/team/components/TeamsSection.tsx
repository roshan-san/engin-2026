import type { Id } from "@convex/_generated/dataModel";
import { MoreHorizontal, Users } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "~/components/shared/EmptyState";
import { Row, RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { TeamFormDialog } from "~/features/teams/team/components/TeamFormDialog";
import { useTeamMutations } from "~/features/teams/team/hooks/useTeams";
import { initials } from "~/lib/initials";

type TeamPerson = {
	_id: Id<"users">;
	name: string | null;
	username: string | null;
	image: string | null;
};

type Team = {
	_id: Id<"teams">;
	name: string;
	description?: string;
	members: TeamPerson[];
};

type TeamsSectionProps = {
	readonly startupId: Id<"startups"> | undefined;
	readonly teams: Team[];
	/** Everyone on the Startup, for the Founder's member picker. */
	readonly people: TeamPerson[];
	readonly isFounder: boolean;
};

function personLabel(person: TeamPerson): string {
	return person.name ?? (person.username ? `@${person.username}` : "Member");
}

/** The Startup's Teams; Founders create, edit, delete and staff them. */
export function TeamsSection({
	startupId,
	teams,
	people,
	isFounder,
}: TeamsSectionProps) {
	const mutations = useTeamMutations(startupId);
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<Team | null>(null);
	const [deleting, setDeleting] = useState<Team | null>(null);

	return (
		<section className="space-y-1">
			<div className="flex items-center justify-between gap-2">
				<SectionLabel>Teams</SectionLabel>
				{isFounder && teams.length > 0 ? (
					<Button size="sm" variant="ghost" onClick={() => setCreating(true)}>
						New Team
					</Button>
				) : null}
			</div>

			{teams.length === 0 ? (
				<EmptyState
					icon={Users}
					title="No Teams yet"
					body={
						isFounder
							? "Group people, Roles and Cycles, like Payments or Growth."
							: undefined
					}
					action={
						isFounder ? (
							<Button size="sm" onClick={() => setCreating(true)}>
								New Team
							</Button>
						) : undefined
					}
				/>
			) : (
				<RowList>
					{teams.map((team) => (
						<Row
							key={team._id}
							leading={<AvatarStack people={team.members} />}
							title={team.name}
							meta={
								team.description ??
								`${team.members.length} ${team.members.length === 1 ? "person" : "people"}`
							}
							trailing={
								isFounder ? (
									<div className="flex items-center gap-1">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button size="sm" variant="outline">
													Members
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-56">
												<DropdownMenuLabel>{team.name}</DropdownMenuLabel>
												{people.map((person) => {
													const isIn = team.members.some(
														(member) => member._id === person._id,
													);
													return (
														<DropdownMenuCheckboxItem
															key={person._id}
															checked={isIn}
															onSelect={(event) => event.preventDefault()}
															onCheckedChange={(checked) =>
																void mutations.setMember(
																	team._id,
																	person._id,
																	checked === true,
																)
															}
														>
															{personLabel(person)}
														</DropdownMenuCheckboxItem>
													);
												})}
											</DropdownMenuContent>
										</DropdownMenu>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													size="sm"
													variant="ghost"
													aria-label={`${team.name} options`}
												>
													<MoreHorizontal className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onSelect={() => setEditing(team)}>
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													variant="destructive"
													onSelect={() => setDeleting(team)}
												>
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								) : null
							}
						/>
					))}
				</RowList>
			)}

			<TeamFormDialog
				open={creating}
				onOpenChange={setCreating}
				onSubmit={mutations.create}
			/>
			<TeamFormDialog
				open={editing !== null}
				onOpenChange={(open) => {
					if (!open) setEditing(null);
				}}
				initial={
					editing
						? { name: editing.name, description: editing.description }
						: undefined
				}
				onSubmit={(input) =>
					editing
						? mutations.update(editing._id, input)
						: Promise.resolve(false)
				}
			/>
			<AlertDialog
				open={deleting !== null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
						<AlertDialogDescription>
							Its Roles and Cycles stay, without a Team. Nobody leaves the
							Startup.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Keep</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								if (deleting) void mutations.remove(deleting._id);
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}

function AvatarStack({ people }: { readonly people: TeamPerson[] }) {
	if (people.length === 0) {
		return (
			<span className="flex size-8 items-center justify-center rounded-full border border-dashed text-muted-foreground">
				<Users aria-hidden className="size-4" />
			</span>
		);
	}
	return (
		<div className="flex -space-x-2">
			{people.slice(0, 3).map((person) => (
				<Avatar
					key={person._id}
					className="size-8 rounded-full ring-2 ring-background"
				>
					{person.image ? <AvatarImage src={person.image} alt="" /> : null}
					<AvatarFallback className="text-xs">
						{initials(person.name, null)}
					</AvatarFallback>
				</Avatar>
			))}
		</div>
	);
}
