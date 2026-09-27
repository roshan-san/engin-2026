import { api } from "@convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

export function useAcceptInvite(token: string) {
	const navigate = useNavigate();
	const invite = useQuery(api.teams.invitations.getByToken, { token });
	const acceptInvite = useMutation(api.teams.invitations.acceptByToken);
	const [isPending, setIsPending] = useState(false);

	async function accept() {
		setIsPending(true);
		try {
			await acceptInvite({ token });
			toast.success("Invite accepted");
			await navigate({ to: "/app" });
		} catch (error) {
			toast.error(toErrorMessage(error, "Failed to accept invite"));
		} finally {
			setIsPending(false);
		}
	}

	return { invite, isPending, accept };
}
