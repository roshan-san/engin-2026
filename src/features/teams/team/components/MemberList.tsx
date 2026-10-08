import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Row, RowList } from "~/components/shared/RowList";
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
import { Spinner } from "~/components/ui/spinner";
import { TeamChip } from "~/features/teams/team/components/TeamChip";
import type { TeamSummary } from "~/features/teams/team/hooks/useTeams";
import { initials } from "~/lib/initials";

type Member = {
	_id: Id<"memberships">;
	role: "founder" | "member";
	user: {
		_id: Id<"users">;
		name: string | null;
		username: string | null;
		image: string | null;
		email: string | null;
	};
};

type MemberListProps = {
	readonly members: Member[];
	/** Founders only: removes a Member (never a co-founder). */
	readonly onRemove?: (membershipId: Id<"memberships">) => Promise<boolean>;
	readonly removingId?: Id<"memberships"> | null;
	/** The Teams each person is in, shown as chips. */
	readonly teamsOf?: (userId: Id<"users">) => TeamSummary[];
};

function displayName(member: Member): string {
	return (
		member.user.name ?? member.user.username ?? member.user.email ?? "Member"
	);
}

export function MemberList({
	members,
	onRemove,
	removingId,
	teamsOf,
}: MemberListProps) {
	const [confirming, setConfirming] = useState<Member | null>(null);

	return (
		<>
			<RowList>
				{members.map((member) => (
					<Row
						key={member._id}
						leading={
							<Avatar className="size-8 rounded-full">
								{member.user.image ? (
									<AvatarImage src={member.user.image} alt="" />
								) : null}
								<AvatarFallback className="text-xs">
									{initials(member.user.name, member.user.email)}
								</AvatarFallback>
							</Avatar>
						}
						title={
							member.user.username ? (
								<Link
									to="/u/$username"
									params={{ username: member.user.username }}
									className="hover:text-link"
								>
									@{member.user.username}
								</Link>
							) : (
								displayName(member)
							)
						}
						meta={
							member.user.username
								? (member.user.name ?? member.user.email)
								: member.user.email
						}
						trailing={
							<div className="flex items-center gap-2">
								<span className="hidden gap-1 sm:flex">
									{teamsOf?.(member.user._id).map((team) => (
										<TeamChip key={team._id} name={team.name} />
									))}
								</span>
								<span>{member.role === "founder" ? "Founder" : "Member"}</span>
								{onRemove && member.role === "member" ? (
									<Button
										type="button"
										size="sm"
										variant="ghost"
										onClick={() => setConfirming(member)}
									>
										Remove
									</Button>
								) : null}
							</div>
						}
					/>
				))}
			</RowList>

			<AlertDialog
				open={confirming !== null}
				onOpenChange={(open) => {
					if (!open) setConfirming(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Remove {confirming ? displayName(confirming) : ""}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							They lose access to this Startup and its Cycles right away and are
							told. Their past Tasks stay.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={removingId != null}>
							Keep
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={removingId != null}
							onClick={async (event) => {
								event.preventDefault();
								if (
									confirming &&
									onRemove &&
									(await onRemove(confirming._id))
								) {
									setConfirming(null);
								}
							}}
						>
							{removingId != null ? <Spinner /> : null}
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
