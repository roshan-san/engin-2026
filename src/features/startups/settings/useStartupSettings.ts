import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { usePublicStartup } from "~/features/startups/public/usePublicStartup";
import { errorMessage } from "~/lib/errors";
import { useUpload } from "~/lib/useUpload";
import type { SettingsDraft } from "./settingsDraft";

/** Saving the Startup's settings and its logo. Failures are toasted and resolve to `false`. */
export function useStartupSettings(startupId: Id<"startups">, slug: string) {
	const updateStartup = useMutation(api.startups.startups.update);
	const { upload } = useUpload();
	// The stored logo is a file id; the public page has its URL.
	const logoUrl = usePublicStartup(slug)?.logo ?? null;

	async function save(changes: Partial<SettingsDraft>) {
		try {
			await updateStartup({ startupId, ...changes });
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	async function saveLogo(file: File) {
		try {
			await updateStartup({ startupId, logo: await upload(file) });
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	return { logoUrl, save, saveLogo };
}
