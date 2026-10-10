import { FaGoogle } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { useGoogleSignIn } from "~/features/people/auth/hooks/useGoogleSignIn";

type GoogleButtonProps = {
	readonly label?: string;
	/** Where to land after signing in; defaults to My Tasks. */
	readonly returnTo?: string;
	readonly variant?: "default" | "outline";
	readonly size?: "sm" | "default" | "lg";
	readonly className?: string;
};

export function GoogleButton({
	label = "Join Engin",
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
			<FaGoogle className="size-4" />
			{isPending ? "Signing in..." : label}
		</Button>
	);
}
