import { useConvexAuth } from "@convex-dev/auth/react";
import { Link, Navigate } from "@tanstack/react-router";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { GoogleButton } from "~/features/people/auth/ui/GoogleButton";

export function LandingPage() {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return <GlobalSpinner />;
	}

	if (isAuthenticated) {
		return <Navigate to="/my-pulses" />;
	}

	return (
		<div className="flex min-h-dvh flex-col bg-background text-foreground p-4">
			<header className="flex items-center justify-between px-2">
				<Link to="/" className="text-2xl font-semibold">
					Engin
				</Link>
				<Link
					to="/discover"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					Discover
				</Link>
			</header>

			<main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-2">
				<div className="space-y-4">
					<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
						Prove you can build.
					</h1>
					<p className="text-lg text-muted-foreground">
						Discover startups, work on real Pulses, and join teams through Trial
						Cycles — not resumes.
					</p>
				</div>
				<GoogleButton />
			</main>
		</div>
	);
}
