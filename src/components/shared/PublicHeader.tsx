import { Button } from "~/components/ui/button";
import { useGoogleSignIn } from "~/features/people/auth/hooks/useGoogleSignIn";
import { EnginLogo } from "~/shell/topbar/EnginLogo";

/** The signed-out bar: the logo and a sign-in button. */
export function PublicHeader() {
	const { signInWithGoogle, isPending } = useGoogleSignIn();

	return (
		<header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
			<div className="flex h-14 items-center gap-1 px-4 md:px-6">
				<EnginLogo to="/" />
				<div className="flex-1" />
				<Button
					size="sm"
					className="ml-2 whitespace-nowrap"
					disabled={isPending}
					onClick={() => void signInWithGoogle()}
				>
					Sign in
				</Button>
			</div>
		</header>
	);
}
