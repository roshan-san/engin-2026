import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** Saving your profile. Failures are toasted and resolve to `false`. */
export function useUpdateProfile() {
	const updateProfile = useMutation(api.people.users.updateProfile);

	async function save(
		changes: FunctionArgs<typeof api.people.users.updateProfile>,
	) {
		try {
			await updateProfile(changes);
			toast.success("Saved");
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	return { save };
}
