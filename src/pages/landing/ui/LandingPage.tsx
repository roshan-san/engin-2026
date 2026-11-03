import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import {
	Navigate,
	useLocation,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { type ComponentType, type ReactNode, useEffect } from "react";
import {
	landingView,
	pickLanding,
	readLastPlace,
	usePlaces,
} from "~/entities/place";
import { GlobalSpinner } from "~/shared/ui/GlobalSpinner";
import {
	BeliefsPanel,
	ContributorsPanel,
	FreePanel,
	HackathonsPanel,
	HeroPanel,
	MomentumPanel,
	SeenPanel,
	WeekPanel,
} from "./LandingSections";

/** Sends a signed-in visitor to the place they were last in, else their first. */
function LandingRedirect() {
	const places = usePlaces();

	if (!places) {
		return <GlobalSpinner />;
	}

	return <Navigate to={pickLanding(places, readLastPlace())} replace />;
}

/**
 * Signs you out once Sign out's trip here wasn't stopped by unsaved work, then
 * drops the marker so coming Back to this entry later doesn't sign you out again.
 */
function SigningOut() {
	const { signOut } = useAuthActions();
	const navigate = useNavigate();
	const router = useRouter();

	useEffect(() => {
		void signOut().then(() => {
			if (router.state.location.state.signingOut) {
				void navigate({ to: "/", replace: true });
			}
		});
	}, [signOut, navigate, router]);

	return <GlobalSpinner />;
}

/** The landing page. Only the signed-out page sits in `Shell`; waiting and redirecting show bare. */
export function LandingPage({
	Shell,
}: {
	readonly Shell: ComponentType<{ readonly children: ReactNode }>;
}) {
	const auth = useConvexAuth();
	const signingOut = useLocation({
		select: (location) => location.state.signingOut === true,
	});
	const view = landingView(auth, signingOut);

	if (view === "wait") {
		return <GlobalSpinner />;
	}

	if (view === "signOut") {
		return <SigningOut />;
	}

	if (view === "redirect") {
		return <LandingRedirect />;
	}

	return (
		<Shell>
			<HeroPanel />
			<SeenPanel />
			<WeekPanel />
			<BeliefsPanel />
			<MomentumPanel />
			<HackathonsPanel />
			<ContributorsPanel />
			<FreePanel />
		</Shell>
	);
}
