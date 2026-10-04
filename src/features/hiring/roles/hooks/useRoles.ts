import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

/** A Startup's Roles, open and closed, with the founder actions on them. */
export function useRoles(startupId: Id<"startups"> | undefined) {
	const roles = useQuery(
		api.hiring.roles.list,
		startupId ? { startupId } : "skip",
	);
	const createRole = useMutation(api.hiring.roles.create);
	const closeRole = useMutation(api.hiring.roles.close);
	const [closingRoleId, setClosingRoleId] = useState<Id<"roles"> | null>(null);

	/** A refusal (live hackathons, not a founder) shows the backend message as is. */
	async function close(roleId: Id<"roles">) {
		if (closingRoleId) {
			return;
		}
		setClosingRoleId(roleId);
		try {
			await closeRole({ roleId });
			toast.success("Role closed");
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not close the Role"));
		} finally {
			setClosingRoleId(null);
		}
	}

	return {
		roles,
		openRoles: roles?.filter((role) => role.status === "open"),
		closedRoles: roles?.filter((role) => role.status === "closed"),
		isLoading: roles === undefined,
		createRole,
		close,
		closingRoleId,
	};
}
