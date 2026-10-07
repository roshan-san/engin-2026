import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { useGoogleSignIn } from "~/features/people/auth/hooks/useGoogleSignIn";
import { EnginMark } from "~/shell/topbar/EnginMark";

const NAV_LINK =
	"whitespace-nowrap rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground";

/** The signed-out bar: same height and glass as the signed-in `TopBar`. */
export function PublicHeader() {
	const { signInWithGoogle, isPending } = useGoogleSignIn();

	return (
		<header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
			<div className="flex h-[52px] items-center gap-1 px-4 md:h-14 md:px-6">
				<EnginMark to="/" className="flex h-full shrink-0" />
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
					className="ml-1 whitespace-nowrap"
					disabled={isPending}
					onClick={() => void signInWithGoogle()}
				>
					Sign in
				</Button>
			</div>
		</header>
	);
}
