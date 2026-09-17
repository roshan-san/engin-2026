import { FaGoogle } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { useGoogleSignIn } from "~/features/auth/hooks/useGoogleSignIn";

export function GoogleButton({ label = "Join Engin" }: { label?: string }) {
	const { signInWithGoogle, isPending } = useGoogleSignIn();

	return (
		<Button
			type="button"
			variant="outline"
			className="rounded-2xl"
			disabled={isPending}
			onClick={signInWithGoogle}
		>
			<FaGoogle className="size-4" />
			{isPending ? "Signing in..." : label}
		</Button>
	);
}
