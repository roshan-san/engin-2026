import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/shared/lib/errors";

/** Creates a Startup; resolves to its slug, or `null` after toasting the error. */
export function useCreateStartup() {
	const create = useMutation(api.startups.create);

	return async (args: Parameters<typeof create>[0]) => {
		try {
			const { slug } = await create(args);
			return slug;
		} catch (error) {
			toast.error(errorMessage(error));
			return null;
		}
	};
}
