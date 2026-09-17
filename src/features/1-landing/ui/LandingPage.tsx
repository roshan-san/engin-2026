import { useConvexAuth } from "@convex-dev/auth/react";
import { Link, Navigate } from "@tanstack/react-router";
import { GitPullRequestArrow } from "lucide-react";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { GoogleButton } from "~/features/2-auth/ui/GoogleButton";

export function LandingPage() {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return <GlobalSpinner />;
	}

	if (isAuthenticated) {
		return <Navigate to="/app/dashboard" />;
	}

	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground p-4">
			<header className="flex items-center italic px-2">
				<Link to="/" className="text-2xl font-bold">
					Engin
				</Link>
			</header>

			<main className="flex flex-1">
				<div className="flex flex-1 items-center justify-center p-8">
					<div className="relative flex h-32 w-32 items-center justify-center">
						<GitPullRequestArrow
							className="absolute h-64 w-64 text-primary transition-all duration-500 animate-pulse blur-in opacity-60"
							strokeWidth={2}
							aria-hidden
						/>
					</div>
				</div>

				<div className="flex flex-1 flex-col justify-center items-start gap-8 ">
					<h1 className="text-5xl font-bold italic">
						The Fast Lane for Founders
					</h1>
					<GoogleButton />
				</div>
			</main>
		</div>
	);
}
