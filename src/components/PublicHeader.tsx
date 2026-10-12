import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { useGoogleSignIn } from "~/features/people/auth/useGoogleSignIn";
import { EnginLogo } from "~/shell/EnginLogo";

/** The signed-out bar: the logo, Explore and a sign-in button. */
export function PublicHeader() {
	const { signInWithGoogle, isPending } = useGoogleSignIn();

	return (
		<header className="shrink-0 border-b border-border bg-background">
			<div className="flex h-14 items-center gap-1 px-4 md:px-6">
				<EnginLogo />
				<div className="flex-1" />
				<Link
					to="/explore"
					className="rounded-md px-2 py-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
				>
					Explore
				</Link>
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
