import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { Row, RowList } from "~/components/shared/RowList";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { initials } from "~/lib/initials";

type Member = {
	_id: Id<"memberships">;
	role: "founder" | "member";
	user: {
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
};

function displayName(member: Member): string {
	return (
		member.user.name ?? member.user.username ?? member.user.email ?? "Member"
	);
}

export function MemberList({ members, onRemove, removingId }: MemberListProps) {
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
									className="hover:text-primary"
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
