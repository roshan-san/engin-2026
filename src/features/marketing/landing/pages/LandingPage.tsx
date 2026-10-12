import { useConvexAuth } from "@convex-dev/auth/react";
import { Navigate } from "@tanstack/react-router";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { GlowHero } from "~/components/GlowHero";
import { GoogleButton } from "~/features/people/auth/components/GoogleButton";
import { PublicShell } from "~/shell/layout/PublicShell";
import { usePlaces } from "~/shell/places/hooks/usePlaces";
import { pickLanding, readLastPlace } from "~/shell/places/landing";

/** Sends a signed-in visitor to the place they were last in, else their first. */
function LandingRedirect() {
	const places = usePlaces();

	if (!places) {
		return <GlobalSpinner />;
	}

	return <Navigate to={pickLanding(places, readLastPlace())} replace />;
}

export function LandingPage() {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return <GlobalSpinner />;
	}

	if (isAuthenticated) {
		return <LandingRedirect />;
	}

	return (
		<PublicShell>
			<div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
				<GlowHero
					title="Hire through hackathons. Run work in Cycles."
					subtitle="Founders hire by watching people build. Contributors build for free and earn a Rating that follows them."
				>
					<GoogleButton label="Get started" variant="default" size="lg" />
				</GlowHero>
			</div>
		</PublicShell>
	);
}
