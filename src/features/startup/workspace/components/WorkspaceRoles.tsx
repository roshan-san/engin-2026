import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { EmptyState } from "~/components/shared/EmptyState";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { toErrorMessage } from "~/lib/validation";

type WorkspaceRolesProps = {
	readonly startupId: Id<"startups">;
	readonly isFounder: boolean;
};

export function WorkspaceRoles({ startupId, isFounder }: WorkspaceRolesProps) {
	const roles = useQuery(api.roles.list, { startupId });
	const closeRoleMutation = useMutation(api.roles.close);

	async function closeRole(roleId: Id<"roles">) {
		try {
			await closeRoleMutation({ roleId });
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not close Role"));
		}
	}

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-lg font-semibold">Roles</h2>
				{isFounder ? (
					<Button asChild size="sm">
						<Link to="/app/startup/roles/new">Post Role</Link>
					</Button>
				) : null}
			</div>
			{roles === undefined ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : roles.length === 0 ? (
				<EmptyState
					title="No Roles"
					description="Post a Role so people can apply, then attach a Trial Cycle."
				/>
			) : (
				<ul className="space-y-2">
					{roles.map((role) => (
						<li
							key={role._id}
							className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center"
						>
							<div className="min-w-0 flex-1">
								<p className="font-medium">{role.title}</p>
								<p className="text-sm text-muted-foreground">{role.type}</p>
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="secondary">{role.status}</Badge>
								{isFounder && role.status === "open" ? (
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() => void closeRole(role._id)}
									>
										Close
									</Button>
								) : null}
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
