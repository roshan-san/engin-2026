import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

/** Signs in with Google, then lands on `returnTo` (a path in this app). */
export function useGoogleSignIn(returnTo = "/my-tasks") {
	const { signIn } = useAuthActions();
	const [isPending, setIsPending] = useState(false);

	async function signInWithGoogle() {
		setIsPending(true);
		try {
			await signIn("google", {
				redirectTo: `${window.location.origin}${returnTo}`,
			});
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Google sign-in failed",
			);
		} finally {
			setIsPending(false);
		}
	}

	return { signInWithGoogle, isPending };
}
