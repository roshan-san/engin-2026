import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { toast } from "sonner";
import { attempt } from "~/shared/lib/errors";

/** Saving your profile. Failures are toasted and resolve to `false`. */
export function useUpdateProfile() {
	const updateProfile = useMutation(api.users.updateProfile);

	async function save(changes: FunctionArgs<typeof api.users.updateProfile>) {
		return attempt(async () => {
			await updateProfile(changes);
			toast.success("Saved");
		});
	}

	return { save };
}
