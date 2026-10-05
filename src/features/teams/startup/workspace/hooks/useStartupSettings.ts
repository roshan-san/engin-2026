import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import type { StartupStage } from "~/features/teams/startup/constants";
import { settingsSchema } from "~/features/teams/startup/public/schemas/startup";
import { toErrorMessage, validate } from "~/lib/validation";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

type SettingsValues = {
	name: string;
	tagline: string;
	description: string;
	category: string;
	stage: StartupStage | "";
	website: string;
	twitterUrl: string;
	linkedinUrl: string;
	githubUrl: string;
	location: string;
	remote: boolean;
	stealth: boolean;
};

/** The Startup's details and stealth mode, edited by Founders on Settings. */
export function useStartupSettings() {
	const { member: active, isLoading } = useStartupRoute();
	const updateStartup = useMutation(api.teams.startups.update);
	const [isPending, setIsPending] = useState(false);
	const [edits, setEdits] = useState<Partial<SettingsValues>>({});

	const startup = active?.startup;

	const values: SettingsValues = {
		name: startup?.name ?? "",
		tagline: startup?.tagline ?? "",
		description: startup?.description ?? "",
		category: startup?.category ?? "",
		stage: startup?.stage ?? "",
		website: startup?.website ?? "",
		twitterUrl: startup?.twitterUrl ?? "",
		linkedinUrl: startup?.linkedinUrl ?? "",
		githubUrl: startup?.githubUrl ?? "",
		location: startup?.location ?? "",
		remote: startup?.remote ?? false,
		stealth: startup ? !startup.isPublic : false,
		...edits,
	};

	function set<Key extends keyof SettingsValues>(
		key: Key,
		value: SettingsValues[Key],
	) {
		setEdits((current) => ({ ...current, [key]: value }));
	}

	async function save() {
		if (!startup) {
			return;
		}

		const result = validate(settingsSchema, {
			...values,
			stage: values.stage || undefined,
			isPublic: !values.stealth,
		});
		if (!result.ok) {
			toast.error(result.message);
			return;
		}
		const data = result.data;

		setIsPending(true);
		try {
			await updateStartup({
				startupId: startup._id,
				name: data.name,
				tagline: data.tagline ?? "",
				description: data.description ?? "",
				category: data.category ?? "",
				stage: data.stage,
				website: data.website ?? "",
				twitterUrl: data.twitterUrl ?? "",
				linkedinUrl: data.linkedinUrl ?? "",
				githubUrl: data.githubUrl ?? "",
				location: data.location ?? "",
				remote: data.remote ?? false,
				isPublic: data.isPublic,
			});
			setEdits({});
			toast.success("Settings saved");
		} catch (error) {
			toast.error(toErrorMessage(error, "Failed to save settings"));
			// Show the stealth mode actually saved, not the one just refused.
			setEdits(({ stealth: _refused, ...rest }) => rest);
		} finally {
			setIsPending(false);
		}
	}

	return {
		slug: startup?.slug,
		plan: active?.plan ?? null,
		isFounder: active?.role === "founder",
		isLoading,
		isPending,
		values,
		set,
		save,
	};
}
