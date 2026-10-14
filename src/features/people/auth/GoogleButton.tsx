import { FcGoogle } from "react-icons/fc";
import { Button } from "~/components/ui/button";
import { useGoogleSignIn } from "~/features/people/auth/useGoogleSignIn";

type GoogleButtonProps = {
	readonly label?: string;
	/** Where to land after signing in; defaults to the landing page, which picks your place. */
	readonly returnTo?: string;
	readonly variant?: "default" | "outline";
	readonly size?: "sm" | "default" | "lg";
	readonly className?: string;
};

/** Signs in with Google: the Google G and, by default, "Sign in". */
export function GoogleButton({
	label = "Sign in",
	returnTo,
	variant = "outline",
	size = "default",
	className,
}: GoogleButtonProps) {
	const { signInWithGoogle, isPending } = useGoogleSignIn(returnTo);

	return (
		<Button
			type="button"
			variant={variant}
			size={size}
			className={className}
			disabled={isPending}
			onClick={signInWithGoogle}
		>
			<FcGoogle aria-hidden className="size-4" />
			{isPending ? "Signing in..." : label}
		</Button>
	);
}
