import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { useTeamMembers } from "~/features/work/cycles/hooks/useCycle";

type CycleMember = {
	_id: Id<"users">;
	name: string | null;
	username: string | null;
};

type CycleMembersProps = {
	readonly startupId: Id<"startups">;
	readonly members: CycleMember[];
	/** Founders manage members of a Cycle that is not closed. */
	readonly canManage: boolean;
	readonly isPending: boolean;
	readonly onChange: (userId: Id<"users">, isMember: boolean) => void;
};

function nameOf(user: { name: string | null; username: string | null }) {
	return user.name ?? user.username ?? "Someone";
}

/** Who works this Cycle besides the Founders, who belong to every Cycle. */
export function CycleMembers({
	startupId,
	members,
	canManage,
	isPending,
	onChange,
}: CycleMembersProps) {
	const [open, setOpen] = useState(false);

	return (
		<section className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
			<span className="text-muted-foreground">Members:</span>
			<span className="min-w-0 break-words">
				{members.length === 0
					? "Founders only"
					: `${members.map(nameOf).join(", ")} + Founders`}
			</span>
			{canManage ? (
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button size="sm" variant="ghost" className="h-7 px-2">
							Manage
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Cycle Members</DialogTitle>
							<DialogDescription>
								Founders belong to every Cycle. Pick the Members who work on
								this one.
							</DialogDescription>
						</DialogHeader>
						{open ? (
							<MemberPicker
								startupId={startupId}
								selected={new Set(members.map((member) => member._id))}
								isPending={isPending}
								onChange={onChange}
							/>
						) : null}
					</DialogContent>
				</Dialog>
			) : null}
		</section>
	);
}

type MemberPickerProps = {
	readonly startupId: Id<"startups">;
	readonly selected: Set<Id<"users">>;
	readonly isPending: boolean;
	readonly onChange: (userId: Id<"users">, isMember: boolean) => void;
};

function MemberPicker({
	startupId,
	selected,
	isPending,
	onChange,
}: MemberPickerProps) {
	const { members } = useTeamMembers(startupId);
	const candidates = members?.filter((member) => member.role === "member");

	if (candidates === undefined) {
		return <p className="text-sm text-muted-foreground">Loading team…</p>;
	}
	if (candidates.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No Members on the team yet. Invite someone from Team first.
			</p>
		);
	}
	return (
		<ul className="space-y-1">
			{candidates.map((member) => {
				const id = `cycle-member-${member.user._id}`;
				return (
					<li key={member._id}>
						<label
							htmlFor={id}
							className="flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-muted/40"
						>
							<Checkbox
								id={id}
								checked={selected.has(member.user._id)}
								disabled={isPending}
								onCheckedChange={(checked) =>
									onChange(member.user._id, checked === true)
								}
							/>
							<span className="min-w-0 truncate">{nameOf(member.user)}</span>
						</label>
					</li>
				);
			})}
		</ul>
	);
}
