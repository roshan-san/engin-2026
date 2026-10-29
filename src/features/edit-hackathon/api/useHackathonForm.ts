import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { attempt, errorMessage } from "~/shared/lib/errors";
import { type HackathonDraft, toDraftArgs } from "../model/draft";

/** Saving and publishing Hackathon drafts. Failures are toasted and resolve to `null` or `false`. */
export function useHackathonForm() {
	const createHackathon = useMutation(api.hiring.hackathons.create);
	const updateHackathon = useMutation(api.hiring.hackathons.update);
	const publishHackathon = useMutation(api.hiring.hackathons.publish);

	async function create(startupId: Id<"startups">, draft: HackathonDraft) {
		try {
			return await createHackathon({ startupId, ...toDraftArgs(draft) });
		} catch (error) {
			toast.error(errorMessage(error));
			return null;
		}
	}

	async function update(hackathonId: Id<"hackathons">, draft: HackathonDraft) {
		return attempt(() =>
			updateHackathon({ hackathonId, ...toDraftArgs(draft) }),
		);
	}

	async function publish(hackathonId: Id<"hackathons">) {
		return attempt(() => publishHackathon({ hackathonId }));
	}

	return { create, update, publish };
}
