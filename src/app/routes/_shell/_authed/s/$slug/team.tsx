import { createFileRoute, redirect } from "@tanstack/react-router";

/** The Team moved into Settings; old links open the Cycle. */
export const Route = createFileRoute("/_shell/_authed/s/$slug/team")({
	beforeLoad: ({ params }) => {
		throw redirect({ to: "/s/$slug/cycle", params: { slug: params.slug } });
	},
});
