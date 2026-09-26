import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "~/features/app/hooks/useCurrentUser";
import { profileSchema } from "~/features/profile/schemas/profile";
import { toErrorMessage, validate } from "~/lib/validation";

export function useProfileEditor() {
	const { user, isLoading } = useCurrentUser();
	const updateProfile = useMutation(api.users.updateProfile);
	const [isPending, setIsPending] = useState(false);

	const [name, setName] = useState<string | null>(null);
	const [username, setUsername] = useState<string | null>(null);
	const [headline, setHeadline] = useState<string | null>(null);
	const [bio, setBio] = useState<string | null>(null);
	const [skills, setSkills] = useState<string | null>(null);
	const [location, setLocation] = useState<string | null>(null);
	const [githubUrl, setGithubUrl] = useState<string | null>(null);
	const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
	const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);

	const values = {
		name: name ?? user?.name ?? "",
		username: username ?? user?.username ?? "",
		headline: headline ?? user?.headline ?? "",
		bio: bio ?? user?.bio ?? "",
		skills: skills ?? (user?.skills ?? []).join(", "),
		location: location ?? user?.location ?? "",
		githubUrl: githubUrl ?? user?.githubUrl ?? "",
		linkedinUrl: linkedinUrl ?? user?.linkedinUrl ?? "",
		portfolioUrl: portfolioUrl ?? user?.portfolioUrl ?? "",
	};

	async function save() {
		const result = validate(profileSchema, values);
		if (!result.ok) {
			toast.error(result.message);
			return;
		}

		setIsPending(true);
		try {
			await updateProfile({
				name: result.data.name ?? "",
				username: result.data.username ?? "",
				headline: result.data.headline ?? "",
				bio: result.data.bio ?? "",
				skills: result.data.skills ?? [],
				location: result.data.location ?? "",
				githubUrl: result.data.githubUrl ?? "",
				linkedinUrl: result.data.linkedinUrl ?? "",
				portfolioUrl: result.data.portfolioUrl ?? "",
			});
			toast.success("Profile saved");
		} catch (error) {
			toast.error(toErrorMessage(error, "Failed to save profile"));
		} finally {
			setIsPending(false);
		}
	}

	return {
		user,
		isLoading,
		isPending,
		values,
		setName,
		setUsername,
		setHeadline,
		setBio,
		setSkills,
		setLocation,
		setGithubUrl,
		setLinkedinUrl,
		setPortfolioUrl,
		save,
	};
}
