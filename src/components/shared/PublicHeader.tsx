import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { useGoogleSignIn } from "~/features/people/auth/hooks/useGoogleSignIn";

export function PublicHeader() {
	const { signInWithGoogle, isPending } = useGoogleSignIn();

	return (
		<header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
			<Link to="/" className="whitespace-nowrap text-lg font-semibold">
				Engin
			</Link>
			<div className="flex shrink-0 items-center gap-2">
				<Link
					to="/discover"
					className="whitespace-nowrap text-sm text-muted-foreground hover:text-foreground"
				>
					Discover
				</Link>
				<Button
					size="sm"
					className="whitespace-nowrap"
					disabled={isPending}
					onClick={() => void signInWithGoogle()}
				>
					Sign in
				</Button>
			</div>
		</header>
	);
}
