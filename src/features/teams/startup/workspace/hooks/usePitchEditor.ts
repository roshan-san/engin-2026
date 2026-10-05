import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { pitchSectionsSchema } from "~/features/teams/startup/public/schemas/startup";
import { toErrorMessage, validate } from "~/lib/validation";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

export type PitchValues = {
	problem: string;
	solution: string;
	product: string;
	traction: string;
	teamBlurb: string;
	techStack: string;
};

/** The Pitch sections Founders edit; the public Pitch shows what's saved. */
export function usePitchEditor() {
	const { member: active, isLoading } = useStartupRoute();
	const updateStartup = useMutation(api.teams.startups.update);
	const [isPending, setIsPending] = useState(false);
	const [edits, setEdits] = useState<Partial<PitchValues>>({});

	const startup = active?.startup;

	const values: PitchValues = {
		problem: startup?.problem ?? "",
		solution: startup?.solution ?? "",
		product: startup?.product ?? "",
		traction: startup?.traction ?? "",
		teamBlurb: startup?.teamBlurb ?? "",
		techStack: (startup?.techStack ?? []).join(", "),
		...edits,
	};

	function set(key: keyof PitchValues, value: string) {
		setEdits((current) => ({ ...current, [key]: value }));
	}

	async function save() {
		if (!startup) {
			return;
		}

		const result = validate(pitchSectionsSchema, values);
		if (!result.ok) {
			toast.error(result.message);
			return;
		}
		const data = result.data;

		setIsPending(true);
		try {
			await updateStartup({
				startupId: startup._id,
				problem: data.problem ?? "",
				solution: data.solution ?? "",
				product: data.product ?? "",
				traction: data.traction ?? "",
				teamBlurb: data.teamBlurb ?? "",
				techStack: (data.techStack ?? "")
					.split(",")
					.map((item) => item.trim())
					.filter(Boolean),
			});
			setEdits({});
			toast.success("Pitch saved");
		} catch (error) {
			toast.error(toErrorMessage(error, "Failed to save Pitch"));
		} finally {
			setIsPending(false);
		}
	}

	return {
		slug: startup?.slug,
		isStealth: startup ? !startup.isPublic : false,
		isFounder: active?.role === "founder",
		isLoading,
		isPending,
		values,
		set,
		save,
	};
}
