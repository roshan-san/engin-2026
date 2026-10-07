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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

type Member = {
	_id: Id<"memberships">;
	role: "founder" | "member";
	user: {
		name: string | null;
		username: string | null;
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
			<ul className="space-y-2">
				{members.map((member) => (
					<li
						key={member._id}
						className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
					>
						<div className="min-w-0">
							<p className="truncate font-medium">{displayName(member)}</p>
							<p className="truncate text-sm text-muted-foreground">
								{member.user.username ? (
									<Link
										to="/u/$username"
										params={{ username: member.user.username }}
										className="hover:text-foreground"
									>
										@{member.user.username}
									</Link>
								) : (
									member.user.email
								)}
							</p>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<Badge variant="secondary">
								{member.role === "founder" ? "Founder" : "Member"}
							</Badge>
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
					</li>
				))}
			</ul>

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
