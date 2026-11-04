import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { attempt } from "~/shared/lib/errors";

/** You leave a startup's team, then go home. Resolves `true` once left; failures are toasted. */
export function useLeaveStartup(
	startupId: Id<"startups">,
	startupName: string,
) {
	const leaveStartup = useMutation(api.contributors.leave);
	const navigate = useNavigate();

	return async function leave() {
		return attempt(async () => {
			await leaveStartup({ startupId });
			toast.success(`You left ${startupName}`);
			await navigate({ to: "/" });
		});
	};
}
