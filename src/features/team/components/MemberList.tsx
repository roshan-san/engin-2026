import { Link } from "@tanstack/react-router";

type Member = {
	_id: string;
	role: string;
	user: {
		name: string | null;
		username: string | null;
		email: string | null;
	};
};

type MemberListProps = {
	readonly members: Member[];
};

export function MemberList({ members }: MemberListProps) {
	if (members.length === 0) {
		return (
			<p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
				No members yet.
			</p>
		);
	}

	return (
		<ul className="space-y-2">
			{members.map((member) => (
				<li
					key={member._id}
					className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
				>
					<div className="min-w-0">
						<p className="truncate font-medium">
							{member.user.name ??
								member.user.username ??
								member.user.email ??
								"Member"}
						</p>
						<p className="truncate text-sm text-muted-foreground">
							{member.user.username ? (
								<Link
									to="/u/$username"
									params={{ username: member.user.username }}
								>
									@{member.user.username}
								</Link>
							) : (
								member.user.email
							)}
						</p>
					</div>
					<p className="shrink-0 text-sm text-muted-foreground">
						{member.role}
					</p>
				</li>
			))}
		</ul>
	);
}
