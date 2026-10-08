import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { useGoogleSignIn } from "~/features/people/auth/hooks/useGoogleSignIn";
import { EnginLogo } from "~/shell/topbar/EnginLogo";

const NAV_LINK =
	"whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60";

/** The signed-out bar: the same row 1 as the signed-in `TopBar`. */
export function PublicHeader() {
	const { signInWithGoogle, isPending } = useGoogleSignIn();

	return (
		<header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
			<div className="flex h-14 items-center gap-1 px-4 md:px-6">
				<EnginLogo to="/" />
				<div className="flex-1" />
				<nav className="flex items-center gap-1">
					<Link to="/explore/startups" className={NAV_LINK}>
						Explore
					</Link>
					<Link to="/pricing" className={NAV_LINK}>
						Pricing
					</Link>
				</nav>
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
