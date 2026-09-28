import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { pitchSchema } from "~/features/teams/startup/public/schemas/startup";
import { toErrorMessage, validate } from "~/lib/validation";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

export function usePitchEditor() {
	const { member: active, isLoading } = useStartupRoute();
	const updateStartup = useMutation(api.teams.startups.update);
	const [isPending, setIsPending] = useState(false);

	const [name, setName] = useState<string | null>(null);
	const [tagline, setTagline] = useState<string | null>(null);
	const [description, setDescription] = useState<string | null>(null);
	const [website, setWebsite] = useState<string | null>(null);
	const [twitterUrl, setTwitterUrl] = useState<string | null>(null);
	const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
	const [githubUrl, setGithubUrl] = useState<string | null>(null);
	const [problem, setProblem] = useState<string | null>(null);
	const [solution, setSolution] = useState<string | null>(null);
	const [product, setProduct] = useState<string | null>(null);
	const [traction, setTraction] = useState<string | null>(null);
	const [teamBlurb, setTeamBlurb] = useState<string | null>(null);
	const [techStack, setTechStack] = useState<string | null>(null);
	const [location, setLocation] = useState<string | null>(null);
	const [remote, setRemote] = useState<boolean | null>(null);
	const [isPublic, setIsPublic] = useState<boolean | null>(null);

	const startup = active?.startup;

	const values = {
		name: name ?? startup?.name ?? "",
		tagline: tagline ?? startup?.tagline ?? "",
		description: description ?? startup?.description ?? "",
		website: website ?? startup?.website ?? "",
		twitterUrl: twitterUrl ?? startup?.twitterUrl ?? "",
		linkedinUrl: linkedinUrl ?? startup?.linkedinUrl ?? "",
		githubUrl: githubUrl ?? startup?.githubUrl ?? "",
		problem: problem ?? startup?.problem ?? "",
		solution: solution ?? startup?.solution ?? "",
		product: product ?? startup?.product ?? "",
		traction: traction ?? startup?.traction ?? "",
		teamBlurb: teamBlurb ?? startup?.teamBlurb ?? "",
		techStack: techStack ?? (startup?.techStack ?? []).join(", "),
		location: location ?? startup?.location ?? "",
		remote: remote ?? startup?.remote ?? false,
		isPublic: isPublic ?? startup?.isPublic ?? false,
	};

	async function save() {
		if (!startup) {
			return;
		}

		const result = validate(pitchSchema, values);
		if (!result.ok) {
			toast.error(result.message);
			return;
		}

		setIsPending(true);
		try {
			await updateStartup({
				startupId: startup._id,
				name: result.data.name,
				tagline: result.data.tagline ?? "",
				description: result.data.description ?? "",
				category: result.data.category,
				stage: result.data.stage,
				website: result.data.website ?? "",
				twitterUrl: result.data.twitterUrl ?? "",
				linkedinUrl: result.data.linkedinUrl ?? "",
				githubUrl: result.data.githubUrl ?? "",
				problem: result.data.problem ?? "",
				solution: result.data.solution ?? "",
				product: result.data.product ?? "",
				traction: result.data.traction ?? "",
				teamBlurb: result.data.teamBlurb ?? "",
				techStack: (result.data.techStack ?? "")
					.split(",")
					.map((item) => item.trim())
					.filter(Boolean),
				location: result.data.location ?? "",
				remote: result.data.remote ?? false,
				isPublic: result.data.isPublic,
			});
			toast.success("Pitch saved");
		} catch (error) {
			toast.error(toErrorMessage(error, "Failed to save Pitch"));
		} finally {
			setIsPending(false);
		}
	}

	return {
		startup,
		isFounder: active?.role === "founder",
		isLoading,
		isPending,
		values,
		setName,
		setTagline,
		setDescription,
		setWebsite,
		setTwitterUrl,
		setLinkedinUrl,
		setGithubUrl,
		setProblem,
		setSolution,
		setProduct,
		setTraction,
		setTeamBlurb,
		setTechStack,
		setLocation,
		setRemote,
		setIsPublic,
		save,
	};
}
