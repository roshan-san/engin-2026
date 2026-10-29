import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { usePublicStartup } from "~/entities/startup";
import { useUpload } from "~/shared/api/useUpload";
import { attempt } from "~/shared/lib/errors";
import type { SettingsDraft } from "./settingsDraft";

/** Saving the Startup's settings and its logo. Failures are toasted and resolve to `false`. */
export function useStartupSettings(startupId: Id<"startups">, slug: string) {
	const updateStartup = useMutation(api.startups.startups.update);
	const { upload } = useUpload();
	// The stored logo is a file id; the public page has its URL.
	const logoUrl = usePublicStartup(slug)?.logo ?? null;

	async function save(changes: Partial<SettingsDraft>) {
		return attempt(async () => {
			await updateStartup({ startupId, ...changes });
			toast.success("Saved");
		});
	}

	async function saveLogo(file: File) {
		return attempt(async () =>
			updateStartup({ startupId, logo: await upload(file) }),
		);
	}

	return { logoUrl, save, saveLogo };
}
